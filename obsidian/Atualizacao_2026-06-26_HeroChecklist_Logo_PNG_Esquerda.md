# Atualização 2026-06-26 — Template "Foto de fundo com checklist": logo PNG à esquerda (1:1 e 9:16)

Revisão do template **hero-checklist** ("Foto de fundo com checklist") no Edge `render-asset`: nos
formatos **1:1 (feed)** e **9:16 (story)**, a logo passou para o **lado esquerdo** e agora usa a **PNG
oficial** `vitra-imobiliaria-vitra-branco.png` (texto "VITRA" branco) em vez do wordmark desenhado em SVG.
O formato **1.91:1 (wide)** ficou **inalterado** (wordmark desenhado, topo direito).

## O que mudou
- `render-asset/index.ts`:
  - Nova constante `VITRA_WORDMARK_WHITE_PNG` — a PNG oficial embutida como data-URI base64 (a Edge não
    acessa o filesystem do dashboard). A fonte (2538×434) foi **reduzida p/ 480px** antes do base64
    (4,4 KB PNG / ~5,9 KB base64) — suficiente para o render a ~120px.
  - Em `buildVitraHeroChecklistSvg`, `logoMarkup` ramifica por formato: feed/story → `<image>` da PNG
    ancorada à ESQUERDA (`x = L.margin`, alinhada à headline); wide → mantém o `<svg>` do
    `VITRA_WORDMARK_WHITE` no topo direito (posição original).
- Render-version bumpada (cache-bust) nos DOIS lados (teste de guarda exige sincronia):
  `_shared/renderVersions.ts` e `creativeTemplateCatalog.js` → `hero-checklist-logo-png-v3`
  (era `hero-checklist-safezone-v2`). Teste `templateCatalog.test.js` atualizado para a nova string.

## Verificação (render real)
- deno check + 21 testes + build OK; deploy do `render-asset` via Supabase CLI.
- Renderizados 2 assets reais hero-checklist (status `generated`, sem desaprovar nada) da campanha "TOM
  MENINO DEUS": **feed 1:1** (070278df) e **story 9:16** (1648cdee). Nos dois, a logo VITRA oficial
  aparece à ESQUERDA, no topo, alinhada à margem da headline, branca e nítida. Wide não testado (sem
  mudança).

## Nota
- O bump força o re-render de TODOS os assets hero-checklist em storage na próxima passada — a arte nova
  (logo à esquerda) será aplicada retroativamente, como esperado.

Commit: Edge (logo PNG + logoMarkup) + render-version (edge+catálogo+teste).
