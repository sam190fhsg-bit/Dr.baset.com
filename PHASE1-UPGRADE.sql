-- المرحلة الأولى: إضافات غير هدامة. لا تحذف الجداول الحالية.
create table if not exists public.events (
 id uuid primary key default gen_random_uuid(), title_ar text not null, title_en text, description_ar text, description_en text,
 event_date date, location_ar text, location_en text, cover_url text, video_url text,
 status text not null default 'past' check (status in ('upcoming','current','past')),
 sort_order integer default 0, is_published boolean default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.sliders (
 id uuid primary key default gen_random_uuid(), title_ar text not null, title_en text, description_ar text, description_en text,
 image_url text, cta_ar text, cta_en text, target_url text, sort_order integer default 0,
 is_published boolean default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.working_hours (
 id uuid primary key default gen_random_uuid(), day_key text unique not null, day_ar text not null, day_en text,
 morning_from time, morning_to time, evening_from time, evening_to time, is_closed boolean default false,
 sort_order integer default 0, updated_at timestamptz default now()
);
create table if not exists public.social_links (
 id uuid primary key default gen_random_uuid(), platform text unique not null, url text not null, sort_order integer default 0,
 is_active boolean default true, updated_at timestamptz default now()
);
alter table public.events enable row level security; alter table public.sliders enable row level security; alter table public.working_hours enable row level security; alter table public.social_links enable row level security;
drop policy if exists "public read events" on public.events; create policy "public read events" on public.events for select using (is_published=true);
drop policy if exists "public read sliders" on public.sliders; create policy "public read sliders" on public.sliders for select using (is_published=true);
drop policy if exists "public read working hours" on public.working_hours; create policy "public read working hours" on public.working_hours for select using (true);
drop policy if exists "public read social links" on public.social_links; create policy "public read social links" on public.social_links for select using (is_active=true);
insert into public.working_hours(day_key,day_ar,day_en,morning_from,morning_to,evening_from,evening_to,sort_order) values
('sat','السبت','Saturday','09:00','14:00','16:00','21:00',1),('sun','الأحد','Sunday','09:00','14:00','16:00','21:00',2),('mon','الاثنين','Monday','09:00','14:00','16:00','21:00',3),('tue','الثلاثاء','Tuesday','09:00','14:00','16:00','21:00',4),('wed','الأربعاء','Wednesday','09:00','14:00','16:00','21:00',5),('thu','الخميس','Thursday','09:00','14:00','16:00','21:00',6)
on conflict(day_key) do update set morning_from=excluded.morning_from,morning_to=excluded.morning_to,evening_from=excluded.evening_from,evening_to=excluded.evening_to,updated_at=now();
insert into public.social_links(platform,url,sort_order) values
('facebook','https://www.facebook.com/Dr.Abdulbaset.clinic',1),('youtube','https://youtube.com/@dr.abdulbaset_clinic?si=IYsRFIycho-GM1yV',2),('instagram','https://www.instagram.com/almamooncenter?stkn=YzByaTI5dTVwMnJr',3)
on conflict(platform) do update set url=excluded.url,is_active=true,updated_at=now();
