# Atualização 2026-06-26 — Copiloto da Operação (MVP Fatia 1)

Primeira fatia do **agente-orientado**: um **Copiloto onipresente** (voz + texto) que entende um comando
em linguagem natural, **planeja**, mostra a **prévia**, e roteia para o subagente certo — **reaproveitando
~80% do que já existe** (generate-copy, Tráfego Pago, Estúdio de Criativos). Mantém a fronteira de
segurança do projeto: **propõe → humano confirma → Meta PAUSED**.

## O que entrou

### Backend — orquestrador (Edge `agente-operacao`)
- `supabase/functions/agente-operacao/index.ts` — **planejador/roteador** (NÃO executa nada; zero efeito
  colateral). Recebe `{ text, brand_scope, role, context, history }`, chama Claude e devolve um **plano**:
  `{ subagente (copy|criativo|trafego|consulta|outro), intencao, resumo, args (slots extraídos),
  faltando[], impacto (baixo|alto), previa, confianca }`.
- Auth/CORS/secret no padrão das Edges de IA (`authorizeAiEdge` + `ANTHROPIC_API_KEY` + gate
  `x-copilot-gate`). `config.toml`: `[functions.agente-operacao] verify_jwt = false`.
- **Modelo:** `claude-sonnet-4-6` (override por secret `COPILOT_ORCH_MODEL`).
- **Decisão técnica (importante):** NÃO usar `output_config`/`json_schema` aqui. Com um schema de campos
  **opcionais**, o decodificador estruturado **pendurava o isolate** (execução de ~151s → 546
  WORKER_RESOURCE_LIMIT). Solução: pedir **JSON no texto** + `parsePlan()` (extrai o 1º `{...}`) com
  **fallback** + **AbortController de 25s** (a Edge nunca fica pendurada; falha graciosa = 504). Depois
  disso: HTTP 200 em ~9s. (Ver [[render-asset-deploy-e-limites]].)
- `faltando` é só para dados **bloqueantes** (copy/criativo → nome do imóvel; trafego → imóvel +
  orçamento diário; consulta → nada). Enriquecimentos (área, diferenciais, CTA) NÃO bloqueiam.

### Frontend — Copiloto global
- `dashboard/src/components/Copilot.jsx` — botão flutuante (estrela dourada com pulso) + painel/drawer.
  - **Voz:** Web Speech API (`SpeechRecognition`, pt-BR) → transcrição editável no campo. Fallback:
    digitar (aviso "voz disponível no Chrome"). Sem dependência paga nem secret novo nesta fatia.
  - **Fluxo:** comando → `planejarComando` → **prévia** (badge do subagente + selo de impacto). Impacto
    **alto** (tráfego) = botão "Confirmar e abrir" + texto deixando claro **PAUSADA / sem verba até
    confirmar**; impacto **baixo** (copy) = "Executar".
  - **Execução por subagente:** `copy` roda **inline** (reusa `generateCopyWithAI` → mostra os ângulos
    com `issues` do copyValidation); `criativo`/`trafego`/`consulta` fazem **handoff** para o módulo
    existente (Estúdio de Criativos / Tráfego Pago / Métricas) — que já têm o fluxo com confirm/PAUSED.
- `dashboard/src/lib/premiumData.js` — `planejarComando(text, { brandScope, role, context, history })`
  (invoke da Edge com `copilotGateHeaders()` + `edgeError`).
- `dashboard/src/App.jsx` — `<Copilot brandScope={activeBrandScope} onNavigate={selectView} />` montado
  globalmente (desktop + mobile), re-tinge conforme a marca ativa.

## Verificação (ao vivo, preview)
- **Tráfego:** "Crie uma campanha de tráfego para o Edifício Aurora com R$ 60 por dia, objetivo leads" →
  plano **TRÁFEGO PAGO** + **⚠ exige confirmação**, prévia citando **PAUSADA**; "Confirmar e abrir"
  navegou para a tela **Tráfego Pago**.
- **Copy:** "Gere copies para o Edifício Aurora, 2 suítes, R$ 950 mil no Menino Deus, lazer completo" →
  plano **COPYWRITING** (rascunho · sem impacto) → "Executar" gerou **3 ângulos** na voz Imobiliária
  (Localização / Preço / Lazer), inline.
- Edge testada via curl: HTTP 200 ~9s; deno check + lint + build OK.

## Próximos passos (Fase 2 — não implementado)
- Transcrição server-side (Whisper) p/ robustez/PT-BR fora do Chrome.
- Execução ponta-a-ponta do `criativo` e do `trafego` dentro do painel (criar campanha + build_draft a
  partir do plano, ainda PAUSED) em vez de só handoff.
- Memória de contexto (usuário/empresa/campanha/imóvel) + tabelas `agent_*` + auditoria do turno.
- Enriquecimento automático puxando imóvel/preset do banco (reduzir ainda mais o que se pergunta).

Commits: orquestrador (Edge + config) + front (Copilot + premiumData + App).
