# Atualizacao 2026-06-19 — Fix: interesse depreciado quebrava o build (fallback p/ geo)

> A Meta recusava a criação do conjunto por incluir um interesse DEPRECIADO ("Porto Alegre"). Build agora
> remove os interesses depreciados e refaz o conjunto só com geo, em vez de falhar. Na `main`. Commit: **cf6a04a**.

## Erro (anexo)
`Graph act_…/adsets: Invalid parameter — Atualize a especificação de direcionamento… deprecated_interest_id
6002925735321 (Porto Alegre) → alternative 6003196574924 (Brazil)`.

## Causa / etapa
Ocorre no **`build_draft`** (Edge `publish-meta-ads`), na **criação do conjunto** (`graphPost /adsets`). O
`targetingFor(spec)` resolve as `interest_keywords` propostas pela IA (`suggest-meta-audiences`) em IDs via
Graph search e as envia em `flexible_spec.interests`. Um deles ("Porto Alegre") está **depreciado** na Meta →
a API rejeita o conjunto inteiro. Como os interesses são montados a partir das keywords, qualquer keyword que
resolva para um interesse depreciado derrubava o build.

## Impacto
O rascunho **não era criado** (falha total) sempre que um conjunto tivesse um interesse depreciado — exatamente
o caso da campanha do anexo. Bloqueava a publicação mesmo com tudo preenchido e criativos aprovados.

## Correção (segura e objetiva)
Interesses são um **reforço opcional** sobre o **geo** (raio/cidade — núcleo validado da "clonar a vencedora").
- `graphPost` passa a anexar o **erro estruturado** (`err.graphError`) para inspeção.
- Na criação do conjunto: `try` com o targeting completo; se a Meta recusar por **direcionamento depreciado/
  inválido** (`error_subcode 1487079` / `deprecated_interest_id` / "Invalid parameter"), o build **remove os
  interesses depreciados** (parseados do erro) — ou **todos**, se não der pra identificá-los — e **recria o
  conjunto só com geo** (retry único). Não falha mais o build.
- Transparência: cada ajuste vai em `built[].targeting_note` + array `targeting_adjustments` na resposta + nota
  na `message`; a UI mostra um bloco azul "Direcionamento ajustado em N conjunto(s)…".
- Decisão de produto: **não** trocamos para o alternativo sugerido ("Brazil" = país inteiro, amplo demais) —
  **removemos** o interesse e deixamos o geo (raio 2km / cidade) segmentar, que é mais preciso.

## Validação
- `deno check` OK; deploy via Supabase CLI (disco==prod).
- Dashboard: lint limpo, **162 testes** ✓, build OK; preview sem erros.
- **Como validar de verdade:** rodar "Criar rascunho na Meta" na campanha do anexo → deve criar o conjunto
  PAUSED com geo e exibir o bloco azul "Direcionamento ajustado" (interesse Porto Alegre removido). Conferir
  no Ads Manager que o conjunto existe com a segmentação geográfica.

Ver [[Atualizacao_2026-06-19_Fix_Botao_Criar_Rascunho_Meta]] e [[Atualizacao_2026-06-19_Correcoes_P0_Trafego_Copywriter]].
