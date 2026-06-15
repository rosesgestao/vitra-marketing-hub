# Atualizacao 2026-06-15 — Meta fase 2b: multiplos conjuntos + publicos por IA

> Segunda sub-fase da fase 2: o agente propoe e monta **N conjuntos por campanha** (um por `ad_group`),
> cada um com **publico/posicionamento sugerido por IA**, ajustado ao estagio do funil. Continua tudo
> **PAUSED + gate** (nada ativa/gasta sozinho). Na `main`, pushado. Commit: **009992b**.

## O que foi entregue
- **Edge `suggest-meta-audiences`** (Anthropic, padrao `generate-copy`): dado o brief + os `ad_groups`
  da campanha, propoe por conjunto faixa etaria + interesses (keywords pt-BR) + posicionamentos +
  racional. **So propoe** — nao toca na Meta. O operador revisa.
- **`publish-meta-ads/build_draft` refatorado**: campanha **CBO** uma vez (teto do operador) e itera
  os conjuntos (`body.ad_sets` revisado). Para cada um: resolve interesses/geo via **Graph search**
  (NUNCA inventa ID; cai em amplo BR se falhar), cria conjunto + criativo (corte 1:1 do grupo) +
  anuncio **PAUSED**, valida copy por grupo, grava 1 `premium_publications` por conjunto. Sem proposta
  -> 1 conjunto (back-compat). `activate` agora liga **todos** os conjuntos/anuncios da campanha.
- **Front**: `suggestMetaAudiences` + `buildMetaDraft({adSets})`; no `PublishMetaPanel`, botao
  "Sugerir publicos por IA" + lista revisavel (label, faixa etaria, interesses em chips, racional).

## Verificacao (ao vivo)
deno check (2 edges) OK, lint limpo, build OK, 151 testes; edges deployadas via CLI. No preview,
"Sugerir publicos" retornou **ao vivo 3 conjuntos** para a campanha Apartamento (awareness/
consideracao/conversao) com interesses imobiliarios reais ("comprar apartamento Porto Alegre",
"cozinha gourmet", "Caixa Economica Federal"...) e ciencia do bairro. O build real dos N conjuntos
depende do secret `META_ACCESS_TOKEN` (mesma sequencia Graph ja provada na fase 1).

## Decisoes / notas
- Orcamento: **CBO** distribui o teto entre os conjuntos automaticamente (operador so define o teto).
- Estrutura: 1 conjunto por `ad_group` existente (as campanhas tem 3–8 grupos). Retargeting cai em
  amplo por enquanto — publico custom/lookalike vem na **2c**.
- Interesses: resolvidos por Graph `/search?type=adinterest`; geo por `adgeolocation` (cidade do brief),
  fallback BR.

## Sequencia restante da fase 2
2c audiences custom/lookalike (lookalike via Graph direto) · 2d formulario instantaneo (exige ToS de
Lead). Continuacao de [[Atualizacao_2026-06-15_Meta_Fase2a_Sync_Metricas]]. Ver [[meta-ads-publicacao]].
