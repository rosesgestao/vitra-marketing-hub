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
// LIMITE: o gate token protege uma ferramenta INTERNA/LOCAL (dashboard nao publicado). Se o dashboard
// for deployado publicamente, o token vaza no bundle — ai troque por auth de usuario real (verify_jwt=true).

export interface AuthDecision {
  ok: boolean;
  status: number;
  error?: string;
  message?: string;
}

// Logica PURA (sem Deno) — cross-importavel pelos testes Vitest. Decide a autorizacao a partir do que
// a requisicao apresentou + os secrets.
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
  if (serviceKey && presented === serviceKey) return { ok: true, status: 200 };

  // Anon/publishable — autorizada SO se o gate token bater (quando o gate esta configurado).
  if (anonKey && presented === anonKey) {
    if (gate && (gateHeader || "") !== gate) {
      return {
        ok: false,
        status: 403,
        error: "forbidden_gate",
        message: "Acesso negado: header x-copilot-gate ausente ou invalido. Esta Edge exige o gate token (COPILOT_GATE).",
      };
    }
    return { ok: true, status: 200 };
  }

  return { ok: false, status: 401, error: "unauthorized" };
}

// Wrapper que le os secrets/headers reais (usado pelas Edges Deno). Deno.env so e tocado quando esta
// funcao e CHAMADA — entao importar este modulo no Vitest (que so usa decideAiEdgeAuth) nao quebra.
export function authorizeAiEdge(req: Request): AuthDecision {
  return decideAiEdgeAuth({
    presented: req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || req.headers.get("apikey"),
    gateHeader: req.headers.get("x-copilot-gate"),
    serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    anonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    gate: Deno.env.get("COPILOT_GATE") ?? "",
  });
}
