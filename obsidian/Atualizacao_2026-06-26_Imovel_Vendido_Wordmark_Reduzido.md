# Atualização 2026-06-26 — Imóvel Vendido (imagem estática): logo → wordmark reduzido

Pedido: na peça **Estúdio de Peças → Marketing Institucional → Imóvel Vendido (versão imagem estática)**,
trocar a logo para a versão **"VITRA — wordmark reduzido"** do brandbook.

## O que mudou
- Arquivo: `dashboard/public/pecas/imovel-vendido-institucional-vitra-imobiliaria.html`.
- Antes: lockup completo inline (emblema "V" facetado + divisória + "VITRA" + descriptor "IMOBILIÁRIA").
- Depois: **wordmark reduzido "VITRA"** (sem ícone nem descriptor), versão **branca** (fundo escuro da
  peça), embutido como `<img class="logo">` com os **pixels oficiais aprovados** do brandbook
  (`brand/vitra-imobiliaria/logos/texto-wordmark/vitra-imobiliaria-vitra-branco.png`, 2538×434, base64
  inline → 100% fiel, self-contained, sem fetch externo).
- CSS ajustado ao novo aspecto (5,85:1): `.logo{width:300px;height:auto}` / `.stage.post{width:250px}`
  (antes 320×107 / 264×88, do lockup 3:1).

## Escopo (separação de marca)
**Só a peça Imobiliária.** O "wordmark reduzido" existe apenas no brandbook da **Imobiliária**
(pasta `texto-wordmark`); o **Premium não tem** esse asset (só lockups horizontal/vertical). Mexer no
Premium inventaria um asset inexistente — fora do escopo e contra a regra de não cruzar marcas.

## Verificação (preview/DOM)
- `img.logo` com `data:image/png;base64…`, `naturalWidth/Height = 2538×434` (dimensões exatas do
  asset aprovado), `complete:true`; **sem resquício** do SVG lockup antigo (`svg.logo` ausente; só o
  `<title>` ainda diz "IMOBILIÁRIA").
- **Export OK:** `html2canvas` rasteriza o `<img>` data-URI sem erro, canvas não-vazio. Backup do HTML
  original salvo no scratchpad.

Commit: peça Imóvel Vendido (estática, Imobiliária) — logo → wordmark reduzido.
