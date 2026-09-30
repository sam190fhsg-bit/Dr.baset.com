-- PHASE 5: Complete authenticated content-editor policies. Safe: no content deletion.
-- Requires public.is_content_editor() from PHASE3.

-- Add useful slider fields without breaking existing rows.
alter table public.sliders add column if not exists eyebrow_ar text;
alter table public.sliders add column if not exists subtitle_ar text;

-- Ensure RLS is enabled.
alter table public.sliders enable row level security;
alter table public.events enable row level security;
alter table public.videos enable row level security;
alter table public.working_hours enable row level security;
alter table public.social_links enable row level security;

-- Authenticated editor write policies.
do $$
declare t text;
begin
  foreach t in array array['sliders','events','videos','working_hours','social_links'] loop
    execute format('drop policy if exists %I on public.%I', t||' editor insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_content_editor())', t||' editor insert', t);
    execute format('drop policy if exists %I on public.%I', t||' editor update', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_content_editor()) with check (public.is_content_editor())', t||' editor update', t);
    execute format('drop policy if exists %I on public.%I', t||' editor delete', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_content_editor())', t||' editor delete', t);
  end loop;
end $$;

-- Editors must be able to read unpublished rows inside the dashboard.
drop policy if exists "sliders editor read all" on public.sliders;
create policy "sliders editor read all" on public.sliders for select to authenticated using (public.is_content_editor());
drop policy if exists "events editor read all" on public.events;
create policy "events editor read all" on public.events for select to authenticated using (public.is_content_editor());
drop policy if exists "videos editor read all" on public.videos;
create policy "videos editor read all" on public.videos for select to authenticated using (public.is_content_editor());
drop policy if exists "hours editor read all" on public.working_hours;
create policy "hours editor read all" on public.working_hours for select to authenticated using (public.is_content_editor());
drop policy if exists "social editor read all" on public.social_links;
create policy "social editor read all" on public.social_links for select to authenticated using (public.is_content_editor());

select 'PHASE5_READY' as status;
