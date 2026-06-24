# Atualizacao 2026-06-24 — Imóvel Vendido (vídeo): 2º modelo de marca d'água (Texto VITRA)

> Adiciona a marca d'água "texto-vitra" como modelo selecionável. Na `main`. Commit: **94ba970**.
> Estende [[Atualizacao_2026-06-24_Imovel_Vendido_Video_Watermark_Master_op40]].

## O que mudou
- Nova **opção de modelo** de marca d'água: **Texto (VITRA)** =
  `video-aprovadas/vitra-mae-watermark-video-texto-vitra-op{15,25,40}.png` (1600×420, só o wordmark VITRA),
  ao lado do já existente **Horizontal (V+VITRA)** (master horizontal-aprovada-branca).
- Copiados `wm-vitra-texto-op{15,25,40}.png` p/ `public/pecas`.
- JS: `WM_FILES={horizontal,texto}` + `wmStyle` + `setWmStyle()`; `applyWm()` monta o src
  `wm-vitra-{modelo}-op{opacidade}.png`. UI ganhou o seletor **"Marca d'água (modelo)"** (Horizontal | Texto);
  o seletor de **opacidade 15/25/40** aplica aos dois. Padrão **Horizontal · 40%** (inalterado).

## Verificação (ao vivo)
build OK (6 PNGs em `dist/pecas`: h-branca + texto, op15/25/40). No preview, por amostragem de pixels:
- Horizontal op40 → `wm-vitra-h-branca-op40.png` (6601×1480), centralizado (centro 540), brilho 123.
- Texto op40 → `wm-vitra-texto-op40.png` (1600×420), centralizado (centro 540), brilho 122.
O seletor troca os modelos; opacidade aplica a ambos. Resto da máscara inalterado.
