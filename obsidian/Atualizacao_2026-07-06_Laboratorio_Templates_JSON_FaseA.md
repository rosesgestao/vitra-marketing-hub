# Estratégia JSON para templates — análise + Laboratório (Fase A) — 2026-07-06

Análise de viabilidade (Dev Sênior/PO/Design/Arquitetura, lente `ui-ux-pro-max`) de uma estratégia baseada
em JSON para gerar criativos a partir de uma referência.

## Achado central
O projeto **já é** um gerador dirigido por schema/JSON. As "Fases 1–5" da proposta já existem:
- `_shared/templateSchemas.ts` — contrato como DADO (archetype, components, fields{charLimit/fallback/
  priority}, lint, approvedVariants, dsVersion) + **zonas por formato** (feed/story/wide) para 7 famílias.
- `_shared/designTokens.ts` — DS como dado (`DS_VERSION ds-2026-07`, `DS_TYPE` Anton/Inter, `DS_COLORS`+
  paleta estendida, strokes, sombra, tratamento de imagem, minLumaContrast WCAG).
- `_shared/creativeLint.ts` (`lintCreative`+`tokenConformance`) + `textFit.ts` — validação automática.
- `render-asset/index.ts` — Satori→SVG→Resvg→PNG, **por-template** (lê as zonas do schema).
- `renderVersions.ts` / `renderTrace.ts` — versionamento + trace.

**Novo de verdade:** (6) IA referência→JSON (hoje schemas são escritos por dev) e (7) **ciclo de vida do
template** (aprovar/reprovar template, não só asset) + um **renderizador genérico** (hoje a composição é
por-família). Renderizador genérico é a aposta de maior risco (qualidade genérico × artesanal).

## Recomendação técnica
Reutilizar o Satori como fonte da verdade + compositor genérico das zonas (Fase B). Tokens **referenciados**
por `dsVersion`, nunca copiados. Schema = estende o `TemplateSchema` (não reinventa).

## Fases (ajustadas à realidade)
- **A (feita):** Laboratório — ciclo de vida do template (baixo risco).
- **B:** compositor genérico (1 arquétipo/1 formato) → medir gap de qualidade.
- **C:** Edge `analyze-reference` (Anthropic visão) propõe o JSON draft → refino humano.

## Fase A entregue (protótipo ISOLADO — decisão do Leonardo)
- Tabela nova `public.experimental_templates` (jsonb schema + status + version + history), RLS padrão
  dashboard_* **incl. DELETE**; aplicada via MCP (4 policies). `supabase/migration-experimental-templates.sql`.
- `premiumData`: `list/create/update/deleteExperimentalTemplate`.
- `views/LaboratorioTemplates.jsx` (item "Laboratório" em Inteligência & automação): seleciona template →
  prévia (referência aprovada, toggle moldura/formato) → estrutura (editáveis × fixos + JSON do schema
  recolhido) → **ciclo de vida** (capturar → aprovar/reprovar/em análise c/ observação → nova versão →
  histórico → excluir), persistido. `App.jsx` (item+branch).
- NÃO renderiza criativo novo (Fase B) nem toca no catálogo/render oficial.

## Verificação
lint + 278 testes + build; preview sem erro; tabela+policies confirmadas no banco. View atrás do login →
Leonardo validou. Commit `9368704`.

## Critério de adoção oficial
Só adotar se o motor genérico (Fase B) bater a qualidade artesanal, a IA (Fase C) economizar tempo real de
dev, o lint passar e nada dos templates oficiais quebrar.

[[Atualizacao_2026-07-06_Modal_Variacoes_Criativos]]
