// Edge Function: agente-operacao — ORQUESTRADOR do Copiloto da Operação Imobiliária (MVP Fatia 1).
// Recebe um comando em linguagem natural (texto, vindo de voz transcrita no browser ou digitado) +
// o contexto da plataforma (marca ativa, perfil) e PLANEJA: classifica a intenção, escolhe o subagente
// (copy / criativo / trafego / consulta), EXTRAI os slots, decide o IMPACTO e escreve uma PRÉVIA.
//
// É um PLANEJADOR/ROTEADOR — NÃO executa nada (zero efeito colateral). A execução real é feita pelo
// dashboard reusando as funções/Edges que já existem (generate-copy, render-asset, publish-meta-ads),
// sempre com prévia + confirmação do usuário; Meta sai PAUSED. A chave fica no secret ANTHROPIC_API_KEY.
//
// Modelo: claude-sonnet-4-6 por padrão (estável neste runtime). Saída = JSON no texto (parseado com
// fallback). NÃO usamos output_config/json_schema aqui: com schema de campos opcionais o decodificador
// estruturado pendurava o isolate (timeout 546). Timeout duro de 25s protege contra qualquer hang.

import { authorizeAiEdge } from "../_shared/edgeAuth.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
// Modelo padrão = mesmo do generate-copy (comprovadamente estável neste runtime de Edge). Pode ser
// trocado por um modelo mais barato (ex.: haiku) via secret COPILOT_ORCH_MODEL quando validado.
const MODEL = Deno.env.get("COPILOT_ORCH_MODEL") ?? "claude-sonnet-4-6";

// Extrai o primeiro objeto JSON do texto do modelo (robusto a markdown/cercas). Sem dependência de
// structured-output da API (que pendurava o decodificador com schema de campos opcionais).
function parsePlan(text: string): any | null {
  if (!text) return null;
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
}

function systemPrompt(scope: string, role: string) {
  const marca = scope === "vitra_premium" ? "Vitra Premium (preto+dourado, editorial/alto padrão)" : "Vitra Imobiliária (navy+dourado, institucional-comercial)";
  return `Você é o AGENTE CENTRAL da Operação Imobiliária da Vitra. Sua tarefa é ENTENDER um comando do operador (em pt-BR, vindo de voz ou texto) e PLANEJAR a ação — você NÃO executa nada, apenas roteia, extrai dados e descreve a prévia.

Marca ativa: ${marca}. Perfil do usuário: ${role || "gestor"}.

SUBAGENTES disponíveis nesta fase:
- copy: gerar/variar COPY de anúncio (headline, texto, CTA) a partir dos fatos do imóvel. Impacto BAIXO (rascunho).
- criativo: gerar PEÇA/CRIATIVO visual do imóvel (1:1/9:16/1.91:1). Impacto BAIXO (rascunho).
- trafego: criar/ajustar CAMPANHA paga (Meta Ads), orçamento, público. Impacto ALTO (envolve verba) — exige confirmação. A campanha SEMPRE é montada PAUSED; ativar é uma ação separada do operador.
- consulta: pedir métricas, desempenho, leads, oportunidades, relatórios. Impacto BAIXO (somente leitura).
- outro: fora do escopo desta fase (responda direcionando ao módulo certo).

REGRAS:
1. Responda APENAS com um objeto JSON válido (sem markdown, sem cercas \`\`\`, sem comentários), nesta forma exata:
{
  "subagente": "copy" | "criativo" | "trafego" | "consulta" | "outro",
  "intencao": "rótulo curto (ex.: gerar-copy, criar-campanha)",
  "resumo": "1 frase em pt-BR do que o usuário pediu",
  "args": { "product_name": "", "price": "", "price_from": "", "neighborhood": "", "location": "", "area": "", "suites": "", "differentials": "", "objetivo": "", "daily_budget_brl": 0, "formato": "", "plataforma": "", "cta": "", "mensagem": "" },
  "faltando": [ { "campo": "", "pergunta": "pergunta curta em pt-BR" } ],
  "impacto": "baixo" | "alto",
  "previa": "prévia clara do que será executado, citando imóvel e marca",
  "confianca": 0.0
}
2. Em \`args\`, preencha SÓ os campos que o usuário disse; omita (ou deixe vazio) o resto. Não invente preço, bairro, orçamento.
3. \`faltando\` é SÓ para dados BLOQUEANTES (sem os quais a ação não roda). NÃO peça enriquecimentos opcionais (área, diferenciais, CTA, etc.) — eles entram só se o usuário disser. Obrigatórios por subagente: copy → o NOME do imóvel; criativo → o NOME do imóvel; trafego → o NOME do imóvel E o orçamento diário; consulta → nada. Se os obrigatórios já vieram, devolva faltando = [].
4. \`impacto\`: 'alto' para trafego (verba) ou qualquer publicação/envio externo; 'baixo' para copy/criativo/consulta.
5. \`previa\`: descreva exatamente o que será feito, citando o imóvel e a marca. Se faltar dado essencial, diga o que falta de forma objetiva.
6. NUNCA proponha ativar campanha ou gastar verba automaticamente. Tudo é rascunho até o operador confirmar.
7. Respeite a separação de marca: não misture vocabulário Imobiliária × Premium.`;
}

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-copilot-gate",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "metodo nao permitido" }), { status: 405, headers: cors });

  const auth = authorizeAiEdge(req);
  if (!auth.ok) return new Response(JSON.stringify({ error: auth.error, message: auth.message }), { status: auth.status, headers: cors });

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({
      error: "not_configured",
      message: "ANTHROPIC_API_KEY nao configurado. Defina o secret para ativar o copiloto: npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...",
    }), { status: 503, headers: cors });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* corpo vazio */ }
  const text = String(body.text || "").trim();
  if (!text) return new Response(JSON.stringify({ error: "empty", message: "Comando vazio." }), { status: 400, headers: cors });
  const scope = body.brand_scope === "vitra_premium" ? "vitra_premium" : "vitra_imobiliaria";
  const role = String(body.role || "gestor");
  // Contexto opcional já conhecido pela plataforma (reduz perguntas): imóvel/campanha selecionados, histórico curto.
  const ctx = body.context && typeof body.context === "object" ? body.context : {};
  const historico = Array.isArray(body.history) ? body.history.slice(-6) : [];

  const userContent =
    (Object.keys(ctx).length ? `CONTEXTO DA PLATAFORMA (use para não repetir perguntas):\n${JSON.stringify(ctx)}\n\n` : "") +
    (historico.length ? `CONVERSA RECENTE:\n${historico.map((m: any) => `${m.role}: ${m.text}`).join("\n")}\n\n` : "") +
    `COMANDO DO OPERADOR:\n${text}`;

  // Timeout duro (AbortController): a Edge nunca fica pendurada esperando a Anthropic — falha graciosa.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const aRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system: [{ type: "text", text: systemPrompt(scope, role), cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userContent }],
      }),
    });
    clearTimeout(timer);
    if (!aRes.ok) {
      const detail = await aRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: "anthropic_error", status: aRes.status, detail }), { status: 502, headers: cors });
    }
    const data = await aRes.json();
    const textBlock = (data.content || []).find((b: any) => b.type === "text");
    const plan = parsePlan(textBlock?.text || "");
    if (!plan) {
      // Fallback: não conseguimos extrair JSON — devolve um plano "outro" com o texto, sem quebrar a UI.
      return new Response(JSON.stringify({
        plan: { subagente: "outro", intencao: "indefinido", resumo: text, args: {}, faltando: [], impacto: "baixo", previa: textBlock?.text || "Não entendi o comando. Pode reformular?", confianca: 0.2 },
        model: data.model || MODEL, usage: data.usage || null,
      }), { headers: cors });
    }
    return new Response(JSON.stringify({ plan, model: data.model || MODEL, usage: data.usage || null }), { headers: cors });
  } catch (error) {
    clearTimeout(timer);
    const aborted = (error as Error)?.name === "AbortError";
    return new Response(JSON.stringify({ error: aborted ? "timeout" : "exception", message: aborted ? "O copiloto demorou demais para responder. Tente de novo." : String((error as Error)?.message || error) }), { status: aborted ? 504 : 500, headers: cors });
  }
});
