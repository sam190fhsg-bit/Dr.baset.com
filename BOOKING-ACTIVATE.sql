-- تشغيل استقبال الحجوزات من الموقع بدون السماح للزائر بقراءة بيانات الحجوزات
alter table public.bookings enable row level security;
drop policy if exists "public submit bookings" on public.bookings;
create policy "public submit bookings" on public.bookings for insert with check (true);
