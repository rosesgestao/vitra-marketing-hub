// Auth compartilhada das Edges de IA (generate-copy, extract-facts, suggest-template, publish-meta-ads,
// etc.). Estas Edges chamam APIs PAGAS/sensiveis (Anthropic, Meta), entao nao basta a chave
// anon/publishable (que e PUBLICA por design — vai no bundle do navegador).
//
// Modelo (endurecido para DEPLOY PUBLICO, jul/2026): TRES caminhos autorizados —
//   1. Service role (server-side: cron/reaper) — ISENTA (ja e privilegiada).
//   2. USUARIO AUTENTICADO (login real via Supabase Auth) — o JWT do usuario tem claim role
//      'authenticated'. Como as Edges de IA usam verify_jwt=true, a PLATAFORMA ja validou a ASSINATURA
//      do JWT antes de a Edge rodar — entao confiar no claim `role` decodificado e seguro (um JWT
//      forjado nao passaria pelo verify_jwt). Este e o caminho de PRODUCAO (dashboard publicado).
//   3. Anon/publishable + gate token (x-copilot-gate == COPILOT_GATE) — caminho de DEV/LOCAL. Em
//      producao o app exige login (caminho 2), entao o anon cai aqui e, com COPILOT_GATE setado e SEM
//      o header (a publishable nunca leva o gate no bundle), e NEGADO. Mantido so para o dev rodar sem
//      login. Se COPILOT_GATE nao esta setado, abre (graceful) e sinaliza openMode p/ alerta.
//
// Por que role decodificado e seguro: verify_jwt=true (config.toml) faz a plataforma Supabase rejeitar
// qualquer Authorization Bearer com assinatura invalida/expirada ANTES da Edge. authorizeAiEdge so le o
// payload (nao re-verifica) para distinguir usuario (authenticated) de anon.

export interface AuthDecision {
  ok: boolean;
  status: number;
  error?: string;
  message?: string;
  openMode?: boolean; // autorizado via anon SEM gate (secret ausente) — Edge operando ABERTA
  via?: "service" | "user" | "gate"; // como foi autorizado (observabilidade)
}

// Comparacao de strings em TEMPO CONSTANTE no conteudo: evita virar oraculo de timing para recuperar o
// segredo (gate/service key) byte a byte. Vaza so o COMPRIMENTO (nao sensivel: tamanhos sao conhecidos).
// Pura (sem Deno) — roda no Vitest. O `| 0` mantem a operacao em inteiro.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Logica PURA (sem Deno) — cross-importavel pelos testes Vitest. Decide a autorizacao a partir do que
// a requisicao apresentou + os secrets. Comparacoes de segredo em tempo constante (safeEqual).
export function decideAiEdgeAuth(opts: {
  presented: string | null;
  presentedRole?: string | null; // claim `role` do JWT do Authorization (ja verificado pela plataforma)
  gateHeader: string | null;
  serviceKey: string;
  anonKey: string;
  gate: string;
}): AuthDecision {
  const { presented, presentedRole, gateHeader, serviceKey, anonKey, gate } = opts;

  if (!presented) return { ok: false, status: 401, error: "unauthorized" };

  // 1. Service role (server-side: cron/reaper) — autorizada e ISENTA do gate.
  if (serviceKey && safeEqual(presented, serviceKey)) return { ok: true, status: 200, via: "service" };

  // 2. Usuario autenticado (login real via Supabase Auth). O caminho de PRODUCAO. Checado ANTES do anon
  //    porque um usuario logado apresenta o SEU JWT (nao a anon key). verify_jwt=true garante que a
  //    assinatura ja foi validada, entao o claim role='authenticated' e confiavel.
  if (presentedRole === "authenticated") return { ok: true, status: 200, via: "user" };

  // 3. Anon/publishable — autorizada SO se o gate token bater (caminho de DEV/LOCAL). Em producao, sem
  //    o header (a publishable nunca leva o gate) e com COPILOT_GATE setado, e NEGADO -> exige login.
  if (anonKey && safeEqual(presented, anonKey)) {
    if (gate) {
      if (!safeEqual(gateHeader || "", gate)) {
        return {
          ok: false,
          status: 403,
          error: "forbidden_gate",
          message: "Acesso negado: faca login para usar o copiloto de IA. (No dev, configure VITE_COPILOT_GATE = COPILOT_GATE.)",
        };
      }
      return { ok: true, status: 200, via: "gate" };
    }
    // Gate NAO configurado: aberto (graceful). Sinalizado via openMode para virar alerta observavel.
    return { ok: true, status: 200, openMode: true, via: "gate" };
  }

  return { ok: false, status: 401, error: "unauthorized" };
}

// Decodifica (SEM re-verificar assinatura) o claim `role` do JWT. Seguro porque as Edges de IA usam
// verify_jwt=true: a plataforma Supabase ja rejeitou assinaturas invalidas/expiradas antes daqui.
// So distingue usuario autenticado (role='authenticated') de anon (role='anon') e service_role.
function jwtRole(token: string | null): string | null {
  if (!token || token.split(".").length !== 3) return null;
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)));
    return typeof payload?.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

// Wrapper que le os secrets/headers reais (usado pelas Edges Deno). Deno.env so e tocado quando esta
// funcao e CHAMADA — entao importar este modulo no Vitest (que so usa decideAiEdgeAuth) nao quebra.
export function authorizeAiEdge(req: Request): AuthDecision {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;
  const decision = decideAiEdgeAuth({
    presented: bearer || req.headers.get("apikey"),
    presentedRole: jwtRole(bearer),
    gateHeader: req.headers.get("x-copilot-gate"),
    serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    anonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    gate: Deno.env.get("COPILOT_GATE") ?? "",
  });
  // Observabilidade: se o gate sumir (secret perdido/rotacionado), a Edge paga reabre — alerta no log
  // (a fatura seria o unico outro sinal). Aparece nos logs da Edge no painel do Supabase.
  if (decision.openMode) {
    console.warn("[edgeAuth] COPILOT_GATE ausente — Edge de IA operando ABERTA (a chave publishable autoriza chamada PAGA). Defina o secret COPILOT_GATE.");
  }
  return decision;
}
