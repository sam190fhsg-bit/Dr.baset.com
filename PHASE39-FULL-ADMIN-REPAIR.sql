-- PHASE39: إصلاح شامل لصلاحيات لوحة الإدارة + المناظير + رفع صور الفعاليات
-- غير هدام للبيانات. لا يحذف أي سجل محتوى.

alter table if exists public.services add column if not exists category text;
alter table if exists public.services add column if not exists is_published boolean default true;
alter table if exists public.services add column if not exists sort_order integer default 0;
alter table if exists public.services add column if not exists body_ar text;
alter table if exists public.services add column if not exists short_description_ar text;
alter table if exists public.services add column if not exists image_url text;

alter table if exists public.events add column if not exists is_published boolean default true;
alter table if exists public.events add column if not exists cover_url text;
alter table if exists public.events add column if not exists place_ar text;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['diseases','services','articles','faqs','events','sliders','videos','working_hours','social_links','media'] LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format('alter table public.%I enable row level security',t);
      EXECUTE format('drop policy if exists %I on public.%I', 'phase39 editor select',t);
      EXECUTE format('drop policy if exists %I on public.%I', 'phase39 editor insert',t);
      EXECUTE format('drop policy if exists %I on public.%I', 'phase39 editor update',t);
      EXECUTE format('drop policy if exists %I on public.%I', 'phase39 editor delete',t);
      EXECUTE format('create policy %I on public.%I for select to authenticated using (public.is_content_editor())', 'phase39 editor select',t);
      EXECUTE format('create policy %I on public.%I for insert to authenticated with check (public.is_content_editor())', 'phase39 editor insert',t);
      EXECUTE format('create policy %I on public.%I for update to authenticated using (public.is_content_editor()) with check (public.is_content_editor())', 'phase39 editor update',t);
      EXECUTE format('create policy %I on public.%I for delete to authenticated using (public.is_content_editor())', 'phase39 editor delete',t);
    END IF;
  END LOOP;
END $$;

grant select,insert,update,delete on table public.diseases,public.services,public.articles,public.faqs,public.events to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('site-media','site-media',true,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true;

drop policy if exists "phase39 site-media editor insert" on storage.objects;
create policy "phase39 site-media editor insert" on storage.objects for insert to authenticated with check (bucket_id='site-media' and public.is_content_editor());
drop policy if exists "phase39 site-media editor update" on storage.objects;
create policy "phase39 site-media editor update" on storage.objects for update to authenticated using (bucket_id='site-media' and public.is_content_editor()) with check (bucket_id='site-media' and public.is_content_editor());
drop policy if exists "phase39 site-media editor delete" on storage.objects;
create policy "phase39 site-media editor delete" on storage.objects for delete to authenticated using (bucket_id='site-media' and public.is_content_editor());
