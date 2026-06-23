# Atualizacao 2026-06-23 — Per-placement FUNCIONANDO: instagram_user_id + render dos 3 formatos

> Fecha o P1: o anúncio por posicionamento (asset_feed_spec) passou a ser aceito pela Meta. Na `main`. Commit: **<HASH>**.

## Pendência #2 — instagram_user_id (resolvida)
O `asset_feed_spec` exigia o ator do Instagram para posições IG. Implementado:
- build busca 1x a conta IG da Página (`graphGet(pageId, "instagram_business_account{id}")`).
- Primeiro tentei `instagram_actor_id` → a Meta rejeitou ("must be a valid Instagram account id" — campo legado
  não aceita o id de conta business). Troquei para o campo moderno **`instagram_user_id`** no
  `object_story_spec` → **aceito**.

## Pendência #1 — render dos 3 formatos (garantido)
Os cortes 9:16 (story) e alguns 1.91:1 (wide) do Murano estavam **aprovados porém sem `public_url`** (nunca
renderizados). Renderizei os faltantes via `render-asset` (um a um — o 9:16 dá `WORKER_RESOURCE_LIMIT`/OOM em
isolate frio; reset p/ `queued` + retry resolve). Agora **os 3 conceitos têm os 3 formatos renderizados**.

## Verificação (ao vivo)
- Build PAUSED com objetivo **Leads (clique)** (não-leadgen), FB+IG todos os posicionamentos, conceito
  "Oportunidade por" (3 formatos + descrição): **`per_placement: true`, `formats: [feed, story, wide]`**,
  `ads:1`, **sem fallback** — a Meta aceitou o asset_feed_spec com as 3 artes mapeadas por posicionamento.
- Banco confirmou `metadata.per_placement=true` no anúncio.
- 4 rascunhos PAUSED de teste criados nas iterações e **apagados** (nada ativado).
- Estado dos assets restaurado: "Oportunidade por" voltou a `generated` (respeita o gate de aprovação
  humana); Destaque/Lista seguem `approved` agora com os 3 formatos renderizados.

## Resumo do comportamento final (build_draft)
- **Não-leadgen** (tráfego/leads-clique/vendas/reconhecimento) com ≥2 formatos renderizados → **arte por
  posicionamento** (feed→feed, 9:16→stories/reels, 1.91:1→coluna direita) com `instagram_user_id`.
- **Leadgen (formulário)** → imagem única (o form só anexa nela) + nota.
- Qualquer recusa da Meta → **fallback** para imagem única (build nunca quebra).

Ver [[Atualizacao_2026-06-23_Criativo_Por_Posicionamento_P1]].
