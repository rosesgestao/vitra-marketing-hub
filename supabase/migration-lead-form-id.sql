-- Fase 2d: guarda o id do formulario instantaneo de Lead criado na Meta por campanha, para reusar de
-- forma idempotente SEM depender de listar leadgen_forms (a listagem exige leads_retrieval, que o token
-- pode nao ter; a criacao funciona). Aplicada via MCP em 2026-06-15.
ALTER TABLE premium_campaigns ADD COLUMN IF NOT EXISTS meta_lead_form_id text;
