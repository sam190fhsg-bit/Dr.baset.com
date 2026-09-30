-- PHASE 6: Slider + Media integration compatibility
-- Safe/additive only. Does not delete content or media.

-- Keep both historical slider button column names available.
alter table public.sliders add column if not exists button_text_ar text;
alter table public.sliders add column if not exists button_url text;
alter table public.sliders add column if not exists cta_ar text;
alter table public.sliders add column if not exists target_url text;
alter table public.sliders add column if not exists eyebrow_ar text;
alter table public.sliders add column if not exists subtitle_ar text;

update public.sliders
set button_text_ar = coalesce(button_text_ar, cta_ar),
    cta_ar = coalesce(cta_ar, button_text_ar),
    button_url = coalesce(button_url, target_url),
    target_url = coalesce(target_url, button_url)
where button_text_ar is null or cta_ar is null or button_url is null or target_url is null;

-- Compatibility for earlier working-hours/social-link schemas.
alter table public.working_hours add column if not exists label_ar text;
alter table public.working_hours add column if not exists day_ar text;
update public.working_hours set label_ar=coalesce(label_ar,day_ar), day_ar=coalesce(day_ar,label_ar);

alter table public.social_links add column if not exists is_published boolean default true;
alter table public.social_links add column if not exists is_active boolean default true;
update public.social_links set is_published=coalesce(is_published,is_active,true), is_active=coalesce(is_active,is_published,true);

-- Public reads + editor access remain protected by RLS.
alter table public.sliders enable row level security;
alter table public.media enable row level security;

drop policy if exists "public read sliders" on public.sliders;
create policy "public read sliders" on public.sliders for select to anon, authenticated using (is_published=true);

drop policy if exists "media public read" on public.media;
drop policy if exists "public read media" on public.media;
create policy "media public read" on public.media for select to anon, authenticated using (deleted_at is null);

create index if not exists media_category_idx on public.media(category);
create index if not exists media_link_idx on public.media(linked_type,linked_id);

select 'PHASE6_SLIDER_MEDIA_READY' as status;
