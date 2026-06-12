# Atualizacao 2026-06-12 — Refino de UI (fase 6): assinatura de entrada + precisao

> Continuacao de [[Atualizacao_2026-06-12_Refino_UI_Fase5_Consistencia_Componentes]]. Skill
> frontend-design para elevar o padrao SEM mudar a identidade (nenhuma cor nova). Na `main`, pushado.
> Commit: **3f3bb7f**. So apresentacao, zero logica. A ousadia em UM lugar (a entrada); o resto, quieto.

## Assinatura — entrada orquestrada das telas
- Keyframe `vitra-rise` (fade + `translateY(10px)`) com easing premium **easeOutQuint**
  (`cubic-bezier(0.22,1,0.36,1)`). O `App` envolve o switch de views num wrapper `key={view}`
  (`.view-enter`), entao a cada navegacao a tela sobe suavemente — um "virar de pagina" editorial,
  calmo, universal (cobre Central, Estudios, operacionais). `prefers-reduced-motion` desliga tudo.

## Bug achado e corrigido na validacao (registrar!)
Com `animation-fill-mode: both`, o transform final resolvia para `matrix(1,0,0,1,0,0)`. Mesmo sendo
**identidade**, isso NAO e o keyword `none` e **cria um containing-block** — os modais `position:fixed`
passavam a se posicionar relativos ao wrapper, deslocados pela largura da sidebar (`left:288`, sem
cobrir a viewport). **Fix:** usar `backwards` (e nao `both`): apos a animacao o transform volta ao
keyword `none` (sem containing-block); como nenhum modal fica aberto durante os 0.5s de navegacao, a
janela com transform e inofensiva. Revalidado por inspecao de DOM: `.view-enter` transform = `none`;
modal `fixed` em `left:0` cobrindo a viewport.

## Precisao tipografica (grounded no subject)
`tabular-nums` nos numeros grandes de KPI (`StatTile` + `MetricTile`). Numa ferramenta de metricas,
algarismos de largura fixa **alinham** coluna a coluna e somem o "tremor" de largura entre `0` e
`R$ 0,00`. E a precisao que a skill valoriza em direcoes minimalistas.

## Validacao
Preview: entrada toca sem quebrar layout; modal `fixed` correto (`left:0`, cobre viewport); KPIs
alinhados. Build OK, lint limpo, **151 testes verdes**. (O renderer do preview, que travou na fase 5,
voltou a funcionar nesta sessao apos restart.)

## Estado do refino de UI (fases 1-6)
Central -> header/hero + modal -> vocabulario compartilhado -> responsividade -> consistencia de
componentes -> **assinatura de entrada + precisao**. O design-system esta coeso, brand-aware e agora
com um momento de movimento proprio. Aprendizado tecnico reutilizavel: cuidado com transform+fill-mode
`both` acima de elementos com `position:fixed` (containing-block).
