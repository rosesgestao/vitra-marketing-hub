# Etapa 6 (increment 2) — Premium no harness (2026-07-02)

Fecha a maior lacuna de cobertura: a marca **Premium** estava 100% descoberta pelo gate. Agora está no
harness.

## Achado (escopo real do Premium)
O catálogo tem **UMA** família Premium: `vitra-premium-lancamento`. E ela é **SVG-direta** (passa por
`buildVitraLancamentoSvg`, que chama `runCreativeLint` → emite `metadata.lint`). Os demais templates
Premium citados no brandbook (photo-offer, editorial-panel…) **não existem no catálogo** — o caminho
**Satori** (`buildTree`/`satori`) não emite lint, mas nenhuma família selecionável usa ele. Então cobrir
`vitra-premium-lancamento` = **cobrir a marca Premium** no gate.

## Entregue
- `creative-qa.mjs`: `insertAsset(..., brand = 'vitra_imobiliaria')` grava `metadata.brand_scope = brand`
  (o render escolhe o brandProfile pela scope do asset). O loop passa `spec.brand`.
- MATRIX: nova família `premium-lancamento` (`brand: 'vitra_premium'`, medio/curto/vazio).

## Verificação
Harness Premium **9/9** (medio/curto/vazio × 3 formatos). Render inspecionado: sai **Premium de verdade**
— fundo preto editorial, dourado, wordmark **VITRA PREMIUM**, badge "LANÇAMENTO", bullets com seta,
"A PARTIR DE R$…", CTA "Entrar na lista VIP" (distinto do navy da Imobiliária). 237 testes + ESLint OK.
Sem mudança no Edge (só o harness) → sem deploy/preview.

Nota: 1ª rodada teve falhas transitórias ("insert: TypeError: fetch failed" + 1 "sem lint") — rede/546;
o re-run deu 9/9. O `renderWithRetry` trata 546, mas o INSERT não tem retry — pequena robustez de harness
a adicionar depois (não bloqueia).

## Estado da Etapa 6
curto/vazio (Imob) ✅ · **Premium ✅**. Restam: preços de extensões diferentes, imagens H/V/quadrada,
baseline de métricas (comparar valores golden além de `ok`). Depois, Etapa 7 (regressão visual golden).
Cobertura do gate agora: **6 selecionáveis Imob + Premium**, cada uma com médio/curto/vazio × 3 formatos.
[[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
