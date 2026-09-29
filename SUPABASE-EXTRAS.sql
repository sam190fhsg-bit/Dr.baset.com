-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor
create table if not exists public.videos (
 id uuid primary key default gen_random_uuid(), title_ar text not null, description_ar text, video_url text not null,
 sort_order integer default 0, is_published boolean default true, created_at timestamptz default now()
);
create table if not exists public.job_applications (
 id uuid primary key default gen_random_uuid(), full_name text not null, phone text not null, email text,
 specialty text, qualification text, experience_years integer, position_requested text, notes text, created_at timestamptz default now()
);
create table if not exists public.survey_responses (
 id uuid primary key default gen_random_uuid(), name text, phone text, reception_rating integer, booking_rating integer,
 waiting_rating integer, overall_rating integer, would_recommend boolean, comments text, created_at timestamptz default now()
);
alter table public.videos enable row level security;
alter table public.job_applications enable row level security;
alter table public.survey_responses enable row level security;
drop policy if exists "public read videos" on public.videos;
create policy "public read videos" on public.videos for select using (is_published = true);
drop policy if exists "public submit jobs" on public.job_applications;
create policy "public submit jobs" on public.job_applications for insert with check (true);
drop policy if exists "public submit surveys" on public.survey_responses;
create policy "public submit surveys" on public.survey_responses for insert with check (true);
