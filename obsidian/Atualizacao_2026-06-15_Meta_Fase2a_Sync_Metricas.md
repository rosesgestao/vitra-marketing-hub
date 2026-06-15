# Atualizacao 2026-06-15 — Meta fase 2a: sync de metricas

> Primeira sub-fase da fase 2 do agente Meta: o dashboard puxa os insights da Meta de volta para
> `premium_metrics`, fechando o loop de ROI. READ-ONLY na Meta (so GET /insights — nao gasta). Na
> `main`, pushado. Commit: **ea037b5**.

## Por que em sub-fases
A fase 2 tem 5 frentes grandes (sync de metricas, multiplos conjuntos+IA, audiences custom/lookalike,
formulario instantaneo). Entregamos **uma por vez** (gate + verificacao + commit). O usuario escolheu
comecar pelo **sync de metricas**, com disparo **manual**.

## O que foi entregue (2a)
- **Edge `sync-metrics-from-meta`** (Deno, read-only): para cada `premium_publications` paga com
  `meta_ad_id`, faz `GET /{ad_id}/insights` (time_increment=1, last_30d), mapeia por dia (leads via
  `actions`) e **upsert** em `premium_metrics` por `(publication_id, metric_date, source='paid')`.
  Guarda o cru em `raw_payload`, marca `last_metrics_sync`. Reusa `_shared/edgeAuth` (gate COPILOT_GATE).
- **Migration** (indice unico) aplicada via MCP — habilita o upsert idempotente (rodar 2x nao duplica).
- **Front**: `premiumData.syncMetricsFromMeta` + botao **"Sincronizar agora (Meta)"** no header de
  Metricas; as tiles/tabela ja leem `premium_metrics`, entao os dados aparecem sozinhos.

## Verificacao
deno check OK, lint limpo, build OK, 151 testes; migration aplicada; Edge deployada via Supabase CLI e
protegida (`forbidden_gate`). No preview, o botao dispara e — sem o token — surge o caminho gracioso
"META_ACCESS_TOKEN nao configurado". Dados reais dependem do secret `META_ACCESS_TOKEN` + uma campanha
com entrega (insights tem ~24h de atraso; campanha PAUSED volta vazio).

## Achados (para as proximas sub-fases)
- **Lookalike**: o MCP nao cria lookalike, mas a Edge fala Graph direto -> da pra criar via
  `subtype=LOOKALIKE` + origin. WEBSITE custom audience precisa de pixel.
- **Formulario instantaneo (2d)**: sem tool MCP -> Graph `/{page_id}/leadgen_forms`; exige aceitar o
  **ToS de Lead** nas Paginas (acao do operador) antes.

## Sequencia restante da fase 2
2b multiplos conjuntos + publicos/posicionamentos por IA · 2c audiences custom/lookalike · 2d
formulario instantaneo de Lead. Continuacao de [[Atualizacao_2026-06-15_Publicacao_Meta_Fase1]].
Ver [[meta-ads-publicacao]] e [[render-asset-deploy-e-limites]].
