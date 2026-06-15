# Atualizacao 2026-06-15 — Meta fase 2c: audiences custom/lookalike

> Terceira sub-fase da fase 2: publicos custom/lookalike na Meta, que alimentam o retargeting dos
> conjuntos (2b). Criar publico nao gasta verba, mas ESCREVE na conta — atras do mesmo gate + secret
> `META_ACCESS_TOKEN`. Na `main`, pushado. Commit: **fe8a9ce**.

## O que foi entregue
- **Edge `manage-audiences`** (Graph direto): `list` (custom audiences), `create_website` (retargeting
  de visitantes do site via pixel, regra ALL_VISITORS) e `create_lookalike` (semelhante a partir de
  uma fonte + BR). O MCP nao cria lookalike; pela Graph direto, sim.
- **`publish-meta-ads/targetingFor`**: quando o conjunto tem `custom_audience_id`, aplica
  `custom_audiences[]` (e nao sobrepoe interesses) — o conjunto de retargeting da 2b passa a usar o
  publico real.
- **Front**: helpers `listMetaAudiences/createWebsiteAudience/createLookalikeAudience`; no
  `PublishMetaPanel`, bloco **"Publicos da Meta"** (Listar + criar publico de site por pixel + criar
  lookalike de uma fonte) e, nos conjuntos de retargeting propostos, um **seletor** de publico custom.

## Verificacao
deno check (2 edges) OK, lint limpo, build OK, 151 testes; edges deployadas via CLI e protegidas
(`forbidden_gate`); bloco "Publicos da Meta" + seletor renderizam no painel (console limpo). Criar/usar
publico de verdade depende do `META_ACCESS_TOKEN` (e de pixel/fonte na conta).

## Notas
- WEBSITE precisa de `pixel_id` (Gerenciador de Eventos). LOOKALIKE precisa de uma audiencia-fonte.
- Engagement/customer-list (lista hasheada) ficaram fora deste corte (rule complexa / PII) — da pra
  adicionar depois; o operador tambem pode criar no Gerenciador e o dashboard lista/usa.

## Resta na fase 2
2d — formulario instantaneo de Lead (exige aceitar o **ToS de Lead** nas Paginas antes). Continuacao
de [[Atualizacao_2026-06-15_Meta_Fase2b_Conjuntos_IA]]. Ver [[meta-ads-publicacao]].
