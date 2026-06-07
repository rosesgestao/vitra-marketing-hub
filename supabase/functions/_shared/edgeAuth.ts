// Auth compartilhada das Edges de IA (generate-copy, extract-facts, suggest-template). Estas Edges
// chamam uma API PAGA (Anthropic), entao nao bastam a chave anon/publishable (que e PUBLICA por design).
//
// Modelo: gate token. Alem de uma chave valida (service role OU anon), o caminho ANON exige tambem o
// header `x-copilot-gate` casando com o secret COPILOT_GATE. Assim a publishable sozinha NAO autoriza
// uma chamada paga. Service role (server-side: cron/reaper) e ISENTA do gate (ja e privilegiada).
//
// Ativacao graciosa: se COPILOT_GATE NAO esta setado, mantem o comportamento atual (aberto) — para nao
// quebrar o dashboard antes da ativacao, igual a logica do ANTHROPIC_API_KEY. Quando o secret e setado
// (e o dashboard passa o header via VITE_COPILOT_GATE), o gate fica ativo.
//
// LIMITE: o gate token protege uma ferramenta INTERNA/LOCAL (dashboard nao publicado). Como as Edges
// usam verify_jwt=false, este modulo e a UNICA linha de defesa (sem backstop da plataforma) na frente
// de uma API paga. Antes de qualquer DEPLOY PUBLICO do dashboard, endurecer com: (a) auth de usuario
// real (verify_jwt=true + JWT), pois o token vazaria no bundle; (b) rate limiting / cap de custo por
// janela nas Edges de IA (defesa em profundidade). Hoje, interno/local, o gate token e suficiente.

export interface AuthDecision {
  ok: boolean;
  status: number;
  error?: string;
  message?: string;
  openMode?: boolean; // autorizado via anon SEM gate (secret ausente) — Edge operando ABERTA
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
  gateHeader: string | null;
  serviceKey: string;
  anonKey: string;
  gate: string;
}): AuthDecision {
  const { presented, gateHeader, serviceKey, anonKey, gate } = opts;

  if (!presented) return { ok: false, status: 401, error: "unauthorized" };

  // Service role (server-side: cron/reaper) — autorizada e ISENTA do gate.
  if (serviceKey && safeEqual(presented, serviceKey)) return { ok: true, status: 200 };

  // Anon/publishable — autorizada SO se o gate token bater (quando o gate esta configurado).
  if (anonKey && safeEqual(presented, anonKey)) {
    if (gate) {
      if (!safeEqual(gateHeader || "", gate)) {
        return {
          ok: false,
          status: 403,
          error: "forbidden_gate",
          message: "Acesso negado: header x-copilot-gate ausente ou invalido. Esta Edge exige o gate token (COPILOT_GATE).",
        };
      }
      return { ok: true, status: 200 };
    }
    // Gate NAO configurado: aberto (graceful). Sinalizado via openMode para virar alerta observavel.
    return { ok: true, status: 200, openMode: true };
  }

  return { ok: false, status: 401, error: "unauthorized" };
}

// Wrapper que le os secrets/headers reais (usado pelas Edges Deno). Deno.env so e tocado quando esta
// funcao e CHAMADA — entao importar este modulo no Vitest (que so usa decideAiEdgeAuth) nao quebra.
export function authorizeAiEdge(req: Request): AuthDecision {
  const decision = decideAiEdgeAuth({
    presented: req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || req.headers.get("apikey"),
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
