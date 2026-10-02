-- نفّذ بعد أخذ نسخة احتياطية. لا يحذف أي جدول أو بيانات موجودة.
create table if not exists public.site_sections (section_key text primary key,content jsonb not null default '{}'::jsonb,updated_at timestamptz not null default now());
alter table public.site_sections enable row level security;
drop policy if exists "Public reads site sections" on public.site_sections;
create policy "Public reads site sections" on public.site_sections for select to anon,authenticated using (true);
drop policy if exists "Editors insert site sections" on public.site_sections;
create policy "Editors insert site sections" on public.site_sections for insert to authenticated with check (public.is_content_editor());
drop policy if exists "Editors update site sections" on public.site_sections;
create policy "Editors update site sections" on public.site_sections for update to authenticated using (public.is_content_editor()) with check (public.is_content_editor());
