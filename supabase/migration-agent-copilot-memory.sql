-- Memória/auditoria do Copiloto da Operação (agent_*). Aplicada em 2026-06-26.
-- Ferramenta interna: RLS habilitada com políticas permissivas anon/authenticated, espelhando
-- premium_campaigns (insert with_check true, select/update using true).
--
--   agent_conversations  conversa (thread) do copiloto, por marca
--   agent_messages       turnos da conversa (user/assistant) — memória curta multi-turno
--   agent_runs           auditoria: cada comando -> plano -> execução (rastreabilidade)

create table if not exists agent_conversations (
  id uuid primary key default gen_random_uuid(),
  brand_scope text not null default 'vitra_imobiliaria',
  title text,
  created_at timestamptz not null default now()
);

create table if not exists agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references agent_conversations(id) on delete cascade,
  role text not null,
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists agent_messages_conv_idx on agent_messages(conversation_id, created_at);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references agent_conversations(id) on delete set null,
  brand_scope text,
  command text,
  subagente text,
  intencao text,
  impacto text,
  plan jsonb,
  status text,           -- planned | executed | handoff | error
  result jsonb,
  created_at timestamptz not null default now()
);
create index if not exists agent_runs_created_idx on agent_runs(created_at desc);

alter table agent_conversations enable row level security;
alter table agent_messages enable row level security;
alter table agent_runs enable row level security;

create policy dashboard_insert_agent_conversations on agent_conversations for insert to anon, authenticated with check (true);
create policy dashboard_select_agent_conversations on agent_conversations for select to anon, authenticated using (true);
create policy dashboard_update_agent_conversations on agent_conversations for update to anon, authenticated using (true) with check (true);

create policy dashboard_insert_agent_messages on agent_messages for insert to anon, authenticated with check (true);
create policy dashboard_select_agent_messages on agent_messages for select to anon, authenticated using (true);

create policy dashboard_insert_agent_runs on agent_runs for insert to anon, authenticated with check (true);
create policy dashboard_select_agent_runs on agent_runs for select to anon, authenticated using (true);
