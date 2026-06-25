# Atualizacao 2026-06-24 — Imóvel Vendido (post estático): redesenho "VENDIDO por <corretor>"

> Redesenho do post estático com foco no corretor (conceito de uma referência do cliente). Na `main`. Commit: **a826779**.

## Conceito (da referência — marca concorrente; só estrutura, sem copiar logo/marca)
Fundo do **empreendimento com blur** + **VENDIDO** no topo + **por** + **nome do corretor** + **nome do
empreendimento em pill dourado** + **foto do corretor** ocupando a base + **logo na base, à frente da foto**.
Adaptado ao brandbook Vitra Imobiliária (navy + dourado, wordmark VITRA, Inter + Playfair) — sem os "fios
dourados" da referência; usei **brilho dourado premium** (glow) próprio da Vitra.

## Mudanças (as 8 pedidas)
1. **Logo na base** do post (z-index à frente). 2. Topo: **só "VENDIDO"**. 3. **"por"** (minúsculo) abaixo.
4. **Campo do nome do corretor** (editável) abaixo de "por". 5. **Campo do empreendimento** sobre **pill de
cor sólida dourada**. 6. **Foto do corretor** (upload) ancorada na base, ocupando a área inferior. 7. **Logo
sobreposta à foto** (camada à frente). 8. **Upload da imagem do empreendimento** → **fundo com blur**.

## Implementação (`imovel-vendido-institucional-vitra-imobiliaria.html`, html2canvas)
- **Blur sem depender de CSS filter no export**: a imagem do empreendimento é **rasterizada borrada num
  canvas** (`ctx.filter=blur(26px)` + cover + overscan) → dataURL → vira o `background` do `.bg`. Assim o
  html2canvas captura o blur já "queimado" (CSS filter não é confiável no html2canvas). Reborra ao trocar de
  formato.
- **Foto do corretor** como `div` com `background-size:contain`/`position:bottom` (object-fit do html2canvas
  1.4.1 é instável) — `z-index:2`; **logo** `z-index:5` (à frente). Texto `z-index:3`.
- Camadas: `.bg`(0) < `.scrim`+`.glow`(1) < `.person`(2) < `.content`(3) < `.ribbon`(4) < `.logo`(5).
- 3 formatos (4:5 · 9:16 · 1:1) com tamanhos/safe-area próprios por classe.

## Verificação (ao vivo)
build OK; console limpo. No preview, com imagens de teste (faixas no fundo + silhueta na frente): **blur real**
no fundo, VENDIDO/por/nome/pill no topo, foto do corretor na base e **logo à frente** dela — conferido nos
**3 formatos** (4:5 referência, 9:16 com safe-area, 1:1 compacto). Export por html2canvas (sem CSS filter no
DOM final → fiel).

## Observações
- Substitui o post institucional anterior (selo VENDIDO + mensagem) **na marca Imobiliária**. A variante
  **Premium** do post segue a antiga — pode receber o mesmo redesenho depois, se quiser.
