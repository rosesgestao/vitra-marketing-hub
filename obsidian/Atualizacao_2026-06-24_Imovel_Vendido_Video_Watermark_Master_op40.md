# Atualizacao 2026-06-24 — Imóvel Vendido (vídeo): marca d'água master op40

> A pedido, troca para o PNG master `horizontal-aprovada-branca` op40. Na `main`. Commit: **e73b96b**.
> Substitui a fonte de [[Atualizacao_2026-06-24_Imovel_Vendido_Video_Watermark_Oficial]].

## O que mudou
- Marca d'água passou a usar a **master oficial** `brand/watermark/horizontal-aprovada-branca/
  vitra-mae-watermark-horizontal-branca-op{15,25,40}.png` (6601×1480) — arquivo indicado pelo cliente.
  Copiados p/ `dashboard/public/pecas/wm-vitra-h-branca-op{15,25,40}.png`; removidas as `wm-vitra-video-h-*`.
- **Padrão op40** (botão e boot). Seletor mantém 15/25/40 (15% fundos claros · 25% médios · 40% padrão).
- `drawWatermark` inalterado (desenha o PNG centralizado pela proporção natural; agora 4,46:1 vs 3,6:1 antes).

## Verificação (ao vivo)
build OK (PNGs em `dist/pecas`; antigas ausentes). No preview, por amostragem de pixels: fonte =
`wm-vitra-h-branca-op40.png` (natural 6601×1480), **centralizada** nos dois formatos (centro 539 ≈ 540 px),
brilho ~123 sobre o navy (op40). Resto da máscara inalterado.
