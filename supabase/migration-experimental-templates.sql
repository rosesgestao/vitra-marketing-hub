-- ------------------------------------------------------------
-- Laboratório de Templates (experimento JSON, Fase A) — tabela ISOLADA.
-- Guarda o ciclo de vida de "templates experimentais": um snapshot do schema (contrato + zonas +
-- campos, derivado do catálogo), status de aprovação, versão e histórico de observações. NÃO toca
-- no catálogo oficial (creativeTemplateCatalog.js) nem no render de produção. RLS permissivo no
-- padrão dashboard_* (anon+authenticated), JÁ com DELETE (lição do fix de exclusão).
-- ------------------------------------------------------------
create table if not exists public.experimental_templates (
  id uuid primary key default gen_random_uuid(),
  brand_scope text not null default 'vitra_imobiliaria',
  name text not null,
  base_template_id text,                 -- id do template do catálogo usado como base/referência
  status text not null default 'draft'
    constraint experimental_templates_status_check
    check (status in ('draft','review','approved','rejected','official','archived')),
  version integer not null default 1,
  schema jsonb not null default '{}'::jsonb,   -- snapshot do schema (contrato/zonas/campos)
  history jsonb not null default '[]'::jsonb,   -- [{at, status, note}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_experimental_templates_brand
  on public.experimental_templates (brand_scope, updated_at desc);

alter table public.experimental_templates enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='experimental_templates' and policyname='dashboard_select_experimental_templates') then
    execute 'create policy dashboard_select_experimental_templates on public.experimental_templates for select to anon, authenticated using (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='experimental_templates' and policyname='dashboard_insert_experimental_templates') then
    execute 'create policy dashboard_insert_experimental_templates on public.experimental_templates for insert to anon, authenticated with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='experimental_templates' and policyname='dashboard_update_experimental_templates') then
    execute 'create policy dashboard_update_experimental_templates on public.experimental_templates for update to anon, authenticated using (true) with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='experimental_templates' and policyname='dashboard_delete_experimental_templates') then
    execute 'create policy dashboard_delete_experimental_templates on public.experimental_templates for delete to anon, authenticated using (true)';
  end if;
end $$;
