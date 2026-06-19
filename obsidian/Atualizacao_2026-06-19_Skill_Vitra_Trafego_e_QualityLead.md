# Atualizacao 2026-06-19 — Skill `vitra-trafego` (v1) + ajuste QUALITY_LEAD no playbook

> Nasce a camada ESTRATEGICA do tráfego pago (analisa/propoe), separada do motor que EXECUTA (edges/DB).
> E o playbook de Lead passa a otimizar por QUALITY_LEAD (espelha a vencedora). Na `main` (codigo);
> a skill e LOCAL (.claude, gitignored, como vitra-conteudo).

## Skill `vitra-trafego` (v1) — `.claude/skills/vitra-trafego/`
Estrategista de Meta Ads: **analisa o historico de campanhas pagas, identifica as VENCEDORAS por contexto
(CPL/leads/maturidade), extrai o padrao e ADAPTA a um novo imovel** (endereco→raio, ticket→formulario,
publico, regiao, objetivo). **So PROPOE** — relatorio em markdown + **JSON do preset** (forma de
`premium_meta_presets.blueprint`, importavel no painel "Presets de campanha" / auto-seed). NAO executa,
NAO ativa, NAO gasta — o build segue do app, PAUSED, sob aprovacao.
- Reusa (read-only): `premium_metrics`, `readMetaCampaignConfig`, `objectivePlaybook`, `premium_meta_presets`,
  `presetBlueprintFromConfig`.
- Regras: vencedora = CPL ≤ mediana do segmento + leads ≥ ~30 + spend minimo + madura (fora do
  aprendizado); penaliza campanha nova com pouco dado (10.06 vs 30.05); score + proveniencia; **TTL ~30-60d**
  p/ depreciar configs velhas; nunca fora dos guards atuais (advantage_audience, QUALITY_LEAD, ToS, marca).
- Arquivos: `SKILL.md` + `references/playbook-trafego.md` (resumo dos objetivos, limiares e shape do JSON).
- Distincao: NAO e `gerar-criativo` (1 criativo) nem o build do app; e a analise/recomendacao em lote
  (espelha `vitra-conteudo` para o organico).

## Ajuste QUALITY_LEAD (commit a seguir)
`_shared/objectivePlaybook.ts` → `leads_form.optimization_goal` de **LEAD_GENERATION → QUALITY_LEAD**
(otimiza por lead QUALIFICADO; espelha a 30.05, CPL R$14,19). deno check + deploy da `publish-meta-ads` OK.
Validado por referencia (a 30.05 roda QUALITY_LEAD); o proximo build real da Azenha confirma ao vivo.

## Como evolui (roadmap da skill)
- **v1 (agora):** ranquear vencedoras + propor preset adaptado (relatorio + JSON).
- **v2:** depreciacao por TTL/score; revalidacao periodica sobre `premium_metrics`.
- **v3:** copiloto de otimizacao (verba, rotacao de criativo 3x3, alocacao entre conjuntos, anomalias de CPL),
  reusando sync-metrics + suggest-meta-audiences + insights da Meta — sempre como proposta sob aprovacao.

Ver [[Atualizacao_2026-06-19_Trafego_Build_PAUSED_Azenha_E2E]] e [[meta-ads-publicacao]].
