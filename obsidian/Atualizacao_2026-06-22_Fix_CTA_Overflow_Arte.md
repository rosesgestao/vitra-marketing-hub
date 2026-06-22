# Atualizacao 2026-06-22 — Fix UX: CTA longo vazava a arte do post

> CTAs em frase (ex.: "Entre em contato com a Vitra e saiba mais…") estouravam o card e invadiam a
> assinatura da marca. Agora o CTA é truncado dentro do pill. Na `main`. Commit: **22406fd**.

## Problema (screenshot do usuário)
Na grade de Produção, a prévia da arte de um post com CTA longo renderizava o texto do CTA em uma linha só,
num "pill" dimensionado pela largura total do texto — sem truncar. Resultado: o texto vazava a largura do
card e passava por cima da assinatura "VITRA IMOBILIÁRIA". Afeta tudo que usa `renderPostArtToCanvas`
(cards, drawer e PNG salvo).

## Causa
`postArt.js`, rodapé: `cw = measureText(cta).width + 56` + `fillText(cta, …)` sem limite de largura. O CTA
orgânico gerado pela IA costuma ser uma FRASE, não um rótulo de botão.

## Correção (`postArt.js`)
O CTA passa a ser tratado como **botão**: trunca para caber no espaço livre (`W - margens - largura da
assinatura`), com reticências; o pill é dimensionado pelo texto truncado e **clampado** ao máximo, sem
invadir a marca. CTAs curtos ("Fale com a Vitra") seguem inteiros. Fix num ponto só → vale para cards,
drawer e PNG.

## Verificação
- lint limpo · build OK.
- Preview ao vivo: card "Cristal" agora mostra "Entre em contato com a Vitra e saiba mais…" dentro do pill,
  sem vazar; demais CTAs curtos intactos (screenshot).

Ver [[Atualizacao_2026-06-22_Producao_Visual_Fase2]].
