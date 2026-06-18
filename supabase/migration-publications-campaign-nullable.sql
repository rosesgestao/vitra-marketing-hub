-- Publicar unificado (content-first): conteudo de marca (sem oferta) tambem pode virar publicacao real.
-- O escopo de marca vive em premium_publications.brand_scope. Espelha migration-content-campaign-nullable.sql.
-- Aplicada em 2026-06-18 no projeto birxcfkyuzqnhyvetbjv.
ALTER TABLE premium_publications ALTER COLUMN campaign_id DROP NOT NULL;
