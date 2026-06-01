-- Bucket publico 'cards' para criativos/imagens das campanhas Premium + policies (anon/authenticated)
insert into storage.buckets (id, name, public)
values ('cards', 'cards', true)
on conflict (id) do update set public = true;

drop policy if exists "cards_dashboard_insert" on storage.objects;
create policy "cards_dashboard_insert" on storage.objects for insert
to anon, authenticated with check (bucket_id = 'cards');

drop policy if exists "cards_dashboard_select" on storage.objects;
create policy "cards_dashboard_select" on storage.objects for select
to anon, authenticated using (bucket_id = 'cards');

drop policy if exists "cards_dashboard_update" on storage.objects;
create policy "cards_dashboard_update" on storage.objects for update
to anon, authenticated using (bucket_id = 'cards') with check (bucket_id = 'cards');
