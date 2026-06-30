# Atualização 2026-06-26 — Wordmark "VITRA" gerado no brandbook (a partir da horizontal aprovada)

Pedido: gerar o wordmark **"VITRA"** a partir de `horizontal-aprovada-hd/vitra-mae-horizontal-aprovada-8k.png`,
salvar no brandbook (repo `vitra-agentes-marketing`), nas 3 cores + SVG, **enquadramento batendo exatamente
com o asset 2538×434 existente**.

## O que foi feito
- Tentei o recorte fresco da fonte 8k via `sharp` (análise de segmentos de tinta: emblema | separador |
  VITRA → isola só o "VITRA"). Saiu limpo, mas com **margens diferentes** do padrão (≈2944×413).
- Como o item 3 pede **bater exatamente** com o 2538×434, usei os **assets canônicos já existentes**
  (`dashboard/.../texto-wordmark/vitra-imobiliaria-vitra-{branco,dourado,navy}.{png,svg}`) — que são o
  recorte oficial do brandbook **desta mesma logo aprovada**, 2538×434, pixels idênticos ao oficial.

## Entregue em (a)
`vitra-agentes-marketing/assets/brand/logos-brandbook-vitra-imobiliaria/wordmark-vitra/`:
- `vitra-imobiliaria-vitra-branco.{png,svg}` · `…-dourado.{png,svg}` · `…-navy.{png,svg}` — **2538×434**,
  transparente, padrão do brandbook. + `README.md` de proveniência.
- Validação visual: as 3 cores renderizam o "VITRA" completo (com o "A" triangular), sem emblema/separador/
  descriptor. PNGs conferidos em 2538×434.

## Observações
- Os `.svg` embutem o PNG (fiéis aos pixels); vetor "traçado" reinterpretaria os glifos — o vetor fiel é o
  arquivo vetorial oficial (fonte Inter), que difere levemente no espaçamento.
- Os arquivos foram **salvos** no repo do brandbook (não commitados lá — é outro repositório; posso
  commitar/“gitar” se quiser).

Sem mudança no projeto atual (só esta nota). Assets no repo do brandbook.
