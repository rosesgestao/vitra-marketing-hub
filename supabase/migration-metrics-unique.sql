-- Fase 2a (sync de metricas Meta): indice unico para UPSERT idempotente em premium_metrics.
-- A Edge sync-metrics-from-meta faz upsert por (publication_id, metric_date, source); sem este indice
-- o onConflict nao tem alvo e rodar o sync 2x duplicaria as linhas de um mesmo dia/publicacao.
-- Idempotente (IF NOT EXISTS): seguro re-aplicar.
CREATE UNIQUE INDEX IF NOT EXISTS premium_metrics_pub_date_source_uniq
  ON premium_metrics (publication_id, metric_date, source);
