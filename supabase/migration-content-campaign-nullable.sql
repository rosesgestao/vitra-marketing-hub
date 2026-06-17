-- Conteudo organico content-first (Opcao A): o post NAO precisa pertencer a uma oferta/campanha.
-- Conteudo de marca (institucional, bastidores, educativo, autoridade, livre/IA) nasce SEM oferta;
-- so conteudo de imovel/oportunidade sugere (nao exige) o vinculo. O escopo de marca vive em
-- metadata.brand_scope (ja gravado por createContentPost). Aplicada em 2026-06-17 no projeto
-- birxcfkyuzqnhyvetbjv.
ALTER TABLE premium_content_posts ALTER COLUMN campaign_id DROP NOT NULL;
