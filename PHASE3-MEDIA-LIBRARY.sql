-- PHASE 3: Secure Media Library + Storage policies
-- Safe: does not delete existing content.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media','site-media',true,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles add column if not exists role text default 'viewer';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('super_admin','admin','editor','viewer'));

alter table public.media add column if not exists title text;
alter table public.media add column if not exists mime_type text;
alter table public.media add column if not exists size_bytes bigint;
alter table public.media add column if not exists width integer;
alter table public.media add column if not exists height integer;
alter table public.media add column if not exists created_by uuid;
alter table public.media add column if not exists updated_by uuid;
alter table public.media enable row level security;

create or replace function public.is_content_editor()
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('super_admin','admin','editor')
  );
$$;

revoke all on function public.is_content_editor() from public;
grant execute on function public.is_content_editor() to authenticated;

drop policy if exists "media public read" on public.media;
drop policy if exists "public read media" on public.media;
create policy "media public read" on public.media for select to anon, authenticated using (deleted_at is null);
drop policy if exists "media editor insert" on public.media;
create policy "media editor insert" on public.media for insert to authenticated with check (public.is_content_editor());
drop policy if exists "media editor update" on public.media;
create policy "media editor update" on public.media for update to authenticated using (public.is_content_editor()) with check (public.is_content_editor());
drop policy if exists "media editor delete" on public.media;
create policy "media editor delete" on public.media for delete to authenticated using (public.is_content_editor());

drop policy if exists "site-media editor insert" on storage.objects;
create policy "site-media editor insert" on storage.objects for insert to authenticated with check (bucket_id='site-media' and public.is_content_editor());
drop policy if exists "site-media editor update" on storage.objects;
create policy "site-media editor update" on storage.objects for update to authenticated using (bucket_id='site-media' and public.is_content_editor()) with check (bucket_id='site-media' and public.is_content_editor());
drop policy if exists "site-media editor delete" on storage.objects;
create policy "site-media editor delete" on storage.objects for delete to authenticated using (bucket_id='site-media' and public.is_content_editor());

-- IMPORTANT: after creating your admin Auth user, assign the role once:
-- update public.profiles set role='super_admin' where id='<AUTH-USER-UUID>';

select id,name,public,file_size_limit,allowed_mime_types from storage.buckets where id='site-media';
