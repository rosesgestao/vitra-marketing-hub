# Fix — Exclusão de campanhas (3 falhas empilhadas) — 2026-07-06

Bug reportado pelo Leonardo: ao clicar em excluir campanha, erro/banner. Diagnóstico ao vivo no banco
(`birxcfkyuzqnhyvetbjv`, via Supabase MCP) revelou **três** falhas empilhadas — o fix do banner expôs a real.

## Cadeia de causas
1. **`deleteCampaign` chamava `supabase.from(PREMIUM_TABLES.campaigns)` — `undefined`.** `PREMIUM_TABLES` é
   um **array** de `{name,label,purpose}`, não um objeto; `.campaigns` não existe. `from(undefined)` lança
   `"Invalid relation name: relation must be a non-empty string"` **no cliente**, antes de tocar o banco.
   Era o erro real. → trocado pelo literal `'premium_campaigns'` (como `loadPremiumWorkspace`).
2. **Faltava policy de DELETE (RLS).** A migration da Fase 1 criou `dashboard_select/insert/update_*` para
   as tabelas operacionais, mas **nenhuma de DELETE**. Com RLS on e sem policy, delete apagava 0 linhas
   **sem erro** (silencioso). Segundo bloqueio, que apareceria após o #1. Confirmado: `DELETE` como
   `authenticated` → `rows=0`.
3. **Banner enganoso.** `missingSchema` casava qualquer mensagem com `premium_`/`relation` → rotulava como
   "Schema não aplicado". Por isso o `"relation"` do erro #1 virava o banner errado.

## Correção
- **Banco:** `supabase/migration-premium-delete-policies.sql` — `dashboard_delete_*` (`anon, authenticated
  using(true)`, espelhando a Fase 1) para 10 tabelas (campanhas, assets, posts, publicações, métricas,
  jobs, contas, snapshots, mídia, presets). Aplicada via MCP `apply_migration`; **10 policies confirmadas**.
  Com a policy em `premium_campaigns`, o `cascade` remove assets/conteúdos/publicações (cascade não depende
  de RLS das filhas).
- **Front:** `deleteCampaign` usa nome literal + `.select('id')` confere linhas removidas (0 → erro
  acionável, fim da falsa sensação de sucesso). `missingSchema` restrito a erro real de tabela ausente
  (`42P01`/`PGRST205`/`does not exist`/`schema cache`).

## Verificação
lint + 278 testes + build (verdes). Migration no banco. Leonardo validou: exclusão funciona ponta a ponta
(campanha some com os cortes, sem banner). Commits `700d5a0` (RLS+banner+guarda) e `d3696fe` (nome literal).

## Pendência registrada (não urgente)
As policies são permissivas (`anon+authenticated`, coerentes com a Fase 1). Antes de endurecer o RLS para
produção, revisar TODO o bloco por role/auth — o comentário da migration base já anota isso.

[[Atualizacao_2026-07-06_Sidebar_Rail_Refino]]
