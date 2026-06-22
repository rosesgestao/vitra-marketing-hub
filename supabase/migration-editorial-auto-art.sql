-- Fase 1 da Produção visual (Conteúdo): flag de "gerar arte ao aprovar" por marca.
-- Aplicada via MCP em 2026-06-22 (apply_migration). Aditiva, default ligado — não quebra linhas existentes.
ALTER TABLE premium_editorial_settings
  ADD COLUMN IF NOT EXISTS auto_art_on_approve boolean NOT NULL DEFAULT true;
