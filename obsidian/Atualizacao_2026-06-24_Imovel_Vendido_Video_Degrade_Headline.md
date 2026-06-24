# Atualizacao 2026-06-24 — Imóvel Vendido (vídeo): degradê da headline reforçado

> O degradê inferior estava suave demais na faixa do texto. Na `main`. Commit: **<HASH>**.

## Problema
O degradê de legibilidade (item 132, mudança 3) só ficava denso na **borda inferior** do quadro; atrás da
headline (que fica mais acima) a opacidade caía para ~30% — pouco contraste sobre footage clara.

## Correção
- Paradas reforçadas: `0% → .40 (30%) → .70 (55%) → .88 (80%) → .94 (100%)` (antes terminava em .82 só na base).
- `botGrad` subiu (story 1060→1000, feed 700→640): o fade começa mais cedo, já denso onde a headline fica.
- Mantido o **fade longo e progressivo** (5 stops ao longo de ~920px no 9:16) — sem faixa rígida, centro livre.

## Verificação (ao vivo)
build OK. No preview, **simulando footage clara (fundo branco)** e medindo o brilho do fundo na linha da
headline (255 = branco/ruim, ~90 = bom): **9:16 = 89** (antes ~178) e **4:5 = 39**. Contraste forte p/ o
texto branco nos dois formatos, mantendo a transição suave. Resto da máscara inalterado.
