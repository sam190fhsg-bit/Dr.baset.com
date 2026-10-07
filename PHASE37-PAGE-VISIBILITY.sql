-- PHASE37: إظهار/إخفاء الصفحات الداخلية وروابطها من لوحة التحكم
-- آمن: لا يحذف أي صفحة أو محتوى.

create table if not exists public.page_visibility (
  page_path text primary key,
  title_ar text not null default '',
  is_visible boolean not null default true,
  show_in_navigation boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.page_visibility enable row level security;
grant select on table public.page_visibility to anon, authenticated;
grant insert, update, delete on table public.page_visibility to authenticated;

drop policy if exists "page visibility public read" on public.page_visibility;
create policy "page visibility public read" on public.page_visibility
for select to anon, authenticated using (true);

drop policy if exists "page visibility editor write" on public.page_visibility;
create policy "page visibility editor write" on public.page_visibility
for all to authenticated
using (public.is_content_editor())
with check (public.is_content_editor());

insert into public.page_visibility(page_path,title_ar,is_visible,show_in_navigation) values
('about.html','عن الدكتور',true,true),
('services.html','الخدمات',true,true),
('conditions.html','جميع الحالات المرضية',true,true),
('internal-medicine.html','أمراض الباطنة',true,true),
('liver.html','أمراض الكبد',true,true),
('gastroenterology.html','أمراض الجهاز الهضمي',true,true),
('endoscopy.html','المناظير',true,true),
('articles.html','المكتبة الطبية والمقالات',true,true),
('faq.html','الأسئلة الشائعة',true,true),
('gallery.html','الصور',true,true),
('videos.html','الفيديوهات',true,true),
('events.html','المؤتمرات والفعاليات',true,true),
('booking.html','الحجز',true,true),
('contact.html','تواصل معنا',true,true),
('identity.html','الرسالة والهوية',true,true),
('careers.html','التوظيف',true,true),
('survey.html','الاستبيان',true,true),
('privacy.html','سياسة الخصوصية',true,false),
('accessibility.html','إمكانية الوصول',true,false),
('medical-disclaimer.html','إخلاء المسؤولية الطبية',true,false)
on conflict (page_path) do nothing;
