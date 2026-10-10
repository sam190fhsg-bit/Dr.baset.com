-- PHASE57. Test in a copy first; do not include patient data.
create table if not exists public.site_campaigns (
 id uuid primary key default gen_random_uuid(), title_ar text not null,
 body_ar text not null default '', image_url text, target_url text,
 starts_at timestamptz, ends_at timestamptz,
 is_published boolean not null default false,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint phase57_dates check(ends_at is null or starts_at is null or ends_at > starts_at)
);
create index if not exists phase57_campaign_dates on public.site_campaigns(is_published,starts_at,ends_at);
alter table public.site_campaigns enable row level security;
revoke all on public.site_campaigns from anon,authenticated;
grant select on public.site_campaigns to anon;
grant select,insert,update,delete on public.site_campaigns to authenticated;
drop policy if exists "phase57 campaign public" on public.site_campaigns;
create policy "phase57 campaign public" on public.site_campaigns for select to anon
 using(is_published and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
drop policy if exists "phase57 campaign editor select" on public.site_campaigns;
create policy "phase57 campaign editor select" on public.site_campaigns for select to authenticated using(public.is_content_editor());
drop policy if exists "phase57 campaign editor insert" on public.site_campaigns;
create policy "phase57 campaign editor insert" on public.site_campaigns for insert to authenticated with check(public.is_content_editor());
drop policy if exists "phase57 campaign editor update" on public.site_campaigns;
create policy "phase57 campaign editor update" on public.site_campaigns for update to authenticated using(public.is_content_editor()) with check(public.is_content_editor());
drop policy if exists "phase57 campaign editor delete" on public.site_campaigns;
create policy "phase57 campaign editor delete" on public.site_campaigns for delete to authenticated using(public.is_content_editor());
