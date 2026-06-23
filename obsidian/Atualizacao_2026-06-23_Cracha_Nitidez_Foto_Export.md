# Atualizacao 2026-06-23 — Crachá: nitidez da foto no export (supersampling 2× / ~600 DPI)

> Foto saía mole no PNG vs. prévia. Corrigido com supersampling, sem mudar layout. Na `main`. Commit: **3f9a7db**.

## Causa raiz
O palco do crachá é 685×1051 px (= 300 DPI no tamanho final 5,8×8,9 cm com sangria). O export chamava o
html2canvas com **`scale:1`** (width/height fixos em 685/1051) → a foto, que ocupa um círculo de ~300 px,
era **rasterizada em ~300 px** no PNG, independentemente da resolução enviada. 300 px num círculo de ~2,5 cm
fica no limite e, com a interpolação bilinear do html2canvas, **aparece mole** — pior que a prévia (onde o
navegador exibe a imagem original reduzida com filtragem de alta qualidade). `scale:1` também ignorou o
devicePixelRatio (sem supersampling).

## Correção (sem alterar layout/proporção/enquadramento/identidade)
- **`EXPORT_SS=2`** → `html2canvas(..., {scale:2})`. O card sai **1370×2102 px (~600 DPI)**; a foto é amostrada
  da fonte original em ~600 px (nítida). Texto/selo re-rasterizados mais finos. PNG lossless (sem compressão).
- Apenas a densidade muda: a janela de captura segue 685×1051 (mesma composição, sangria 2 mm, área de
  segurança 4 mm). Filename/preço de status passam a refletir os px reais.
- Avisos de UI: "1370×2102 px (~600 DPI)"; orientação "use foto ≥ 600 px e evite zoom alto" (evita upscaling
  além da fonte).

## Dimensões recomendadas (impressão PVC)
- Corte 5,4×8,5 cm = 638×1004 px @300 DPI; com sangria 5,8×8,9 cm = 685×1051 @300.
- **Export atual: 1370×2102 px (≈600 DPI no tamanho final)** — folga sobre o mínimo de 300.

## Verificação
Export real medido: **1370×2102 px**, **600 DPI** (no trim+sangria), 151 ms — layout idêntico. lint/build não
afetados (só o gerador estático). Para conferir a foto: subir uma foto ≥600 px e comparar prévia × PNG a 100%.

## Critérios de aceite
PNG ≥ 300 DPI no tamanho final (atingido ~600), foto nítida sem blur perceptível a 100%, sem alteração de
layout/enquadramento, tipografia/selo nítidos, sem compressão com perdas.

Ver [[Atualizacao_2026-06-23_Cracha_Corporativo_PVC]].
