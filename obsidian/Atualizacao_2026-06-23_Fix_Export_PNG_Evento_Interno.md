# Atualizacao 2026-06-23 — Fix do PNG quebrado (evento-interno) no html2canvas

> O preview ficava perfeito, mas o PNG exportado saía com o texto todo sobreposto. Na `main`. Commit: **b1b95aa**.

## Sintoma
PNG do `evento-interno-vitra-imobiliaria.html` com BRASIL/ESCÓCIA empilhando letra a letra e todas as seções
sobrepostas — só no PNG (no preview do navegador estava certo).

## Causa raiz (2 fatores do html2canvas 1.4.1)
1. **Transform inline vencia o CSS.** O `setFmt` aplicava `transform:scale(.4)` **inline** no `.frame`; a regra
   `body.exporting .frame{transform:none}` (folha de estilo) perdia para o inline. Resultado: o html2canvas
   media o palco escalado (saía **432×540**) e desenhava o conteúdo de 1080px dentro disso → colapso/sobreposição.
2. **`inset:0` não resolvido.** As camadas absolutas usavam `inset:0`; o html2canvas não deriva largura/altura de
   `right/bottom`, então `.content` virava largura "auto", os itens flex encolhiam para min-content e o texto
   quebrava letra a letra.

## Correção
- `exportPeca` agora **zera o transform/margin inline do `.frame`** durante a captura (e restaura no finally) —
  garante full-res 1080. Status passa a mostrar a dimensão real do canvas.
- Camadas absolutas (`.bg/.scrim/.glow/.content`) trocaram `inset:0` por `top/left:0 + width/height:100%`.
- `white-space:nowrap` nos títulos (kicker/match/sub/cta) como reforço anti-quebra.

## Verificação (ao vivo, rasterizando o PNG na própria página)
- Antes: canvas **432×540** (escalado, quebrado). Depois: **1080×1350** (Feed) e **1080×1920** (Stories),
  layout idêntico ao preview, sem sobreposição — conferido por screenshot do PNG real injetado.

Ver [[Atualizacao_2026-06-23_Estudio_Pecas_Comunicacao_Interna]].
