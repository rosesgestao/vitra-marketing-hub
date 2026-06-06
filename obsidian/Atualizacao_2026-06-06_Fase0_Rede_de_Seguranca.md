# Atualizacao 2026-06-06 - Fase 0: Rede de Seguranca

## Contexto

Primeira fase de execucao do plano de consolidacao da geracao de criativos
([[Ferramenta Operacional Premium/09 - Plano de Consolidacao da Geracao de Criativos]]).
Objetivo: travar o comportamento atual das funcoes puras de geracao/variacao com testes e CI
ANTES de qualquer refatoracao, para que as Fases 1-4 nao introduzam regressao silenciosa.
Branch: `fase0/rede-de-seguranca`.

## Mudancas

- **Vitest** adicionado como devDependency; scripts `test` e `test:run` no `dashboard/package.json`.
- **`dashboard/vitest.config.js`** standalone (ambiente node, `include: src/**/*.test.js`). De
  proposito NAO estende o `vite.config.js`, para nao carregar o middleware de dev (scraping/sharp/heic)
  no runtime de teste.
- **41 testes de caracterizacao** em `dashboard/src/lib/__tests__/`:
  - `variation.test.js`: clamp/count (3-12, default 8), selecao de conceitos, expansao N x 3 = 24
    formatos no canal meta_ads, com os 3 cortes 1:1/9:16/1.91:1.
  - `imageDistribution.test.js`: `flattenImages`, `rotateItems`, `selectTemplateVariationImage`
    (offset por formato feed/story/wide).
  - `templateCatalog.test.js`: 4 templates Imobiliaria x 1 Premium, 5 recipes por template aprovado,
    references por variante, family<->template_key, brandProfiles.
  - `renderState.test.js`: `needsVitraImobiliariaApprovedTemplateRender` (so financiamento-orla tem render-version).
  - **Bugs conhecidos congelados como baseline** (com comentario): Premium retorna `[]` no contrato
    de template; `recipes[index%5]` duplica copy com count 8; selecao de foto por indice global.
- Mudanca aditiva no codigo: **12 funcoes puras** de `premiumData.js` ganharam `export`
  (`clampNumber`, `metaCreativeVariationCount`, `metaCreativeConceptsForBrand`,
  `selectedTemplateVariationConcepts`, `selectedMetaCreativeConcepts`, `selectedCreativeTemplate`,
  `buildMetaAssetBlueprints`, `flattenImages`, `rotateItems`, `variationTokens`,
  `renderVariationText`, `selectTemplateVariationImage`). Nenhuma logica alterada.
- **CI** em `.github/workflows/ci.yml`: job dashboard (`npm ci` + `test:run` + `vite build`) e job
  edge-functions (`deno check` em render-asset e ingest-source-images).

## Verificacao

- `npm run test:run`: **41 passed (4 arquivos)**.
- `npm run build`: sucesso, bundle identico ao anterior (os exports nao alteram a saida).

## O que NAO foi tocado

- Nenhuma logica de producao, schema, fila de render, RLS ou contrato de Edge.
- As correcoes de comportamento ficam para a Fase 1 (estabilizar o fluxo automatico), agora com
  rede de seguranca para refatorar sem regressao.

## Proximo passo

Fase 1 - drain unico server-side com claim atomico e maquina de estados
(`queued -> rendering -> generated | error` com retry), corrigir o cron e tirar o render-worker
do caminho concorrente. Ver nota 09.
