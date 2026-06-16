# Atualizacao 2026-06-16 — Criativos: preco repetido na headline + CTA por padrao

> Dois ajustes de criativo no hero-checklist + cortes presos renderizados. Na `main`. Commit: **35e6932**.

## Problemas (campanha TOM MENINO DEUS, f086110b)
1. **Preco repetido**: o corte "preco" tinha headline = "De R$1.250.000 por R$1.099.990" E o template
   hero-checklist JA desenha o bloco De/Por a partir de price_from/price -> oferta aparecia 2x.
2. **CTA fora do padrao**: "Simular financiamento" num imovel de R$1,1M (medio/alto padrao).
3. **2 cortes presos em queued/rendering** (546 isolado + auto-render concorrente).

## Correcoes
- **render-asset (hero-checklist)**: `isPriceLikeHeadline()` detecta headline que e o proprio preco
  ("De X por Y" / "R$...por...") e `heroBenefitHeadline()` substitui por titulo de beneficio
  (suites/area/bairro). O preco passa a aparecer **so** no bloco De/Por. Vale para qualquer
  campanha/dado, presente e futuro.
- **generate-copy (Imobiliaria)**: palette de CTA sem "Simular financiamento", com consultivos
  ("Fale com um consultor", "Conhecer o imovel"); + regra: headline NAO usa preco/De-Por.
- **Dado existente**: corte "preco" de f086110b atualizado (headline "Condicao especial no Menino Deus",
  CTA "Fale com um consultor") e re-renderizado.
- **Cortes presos**: reset rendering/error -> queued e render 1-a-1 (isolate quente; story/9:16 por
  ultimo). Os 9 cortes ficaram `generated`.

## Verificacao
deno check (render-asset, generate-copy) OK; deploy. PNG do "preco" 1:1 conferido visualmente: headline
"CONDICAO ESPECIAL NO MENINO DEUS" (beneficio) + De/Por uma vez + checklist + "Fale com um consultor".

## Nota
O 546 isolado reaparece em render frio/pesado mesmo com a serializacao do cliente (que resolve a
concorrencia). Continua autocuravel: reset queued + re-render aquece o isolate. Ver
[[render-asset-deploy-e-limites]] e [[Atualizacao_2026-06-16_Fix_Render_546_CORS]].
