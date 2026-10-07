-- PHASE36: صلاحيات لوحة التحكم الشاملة
-- شغّل مرة واحدة في Supabase SQL Editor بحساب مالك المشروع.
-- لا يحذف هذا الملف أي بيانات.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'diseases','services','articles','faqs','sliders','events','videos',
    'working_hours','social_links','site_sections','media'
  ] LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format('grant select, insert, update, delete on table public.%I to authenticated',t);
      EXECUTE format('alter table public.%I enable row level security',t);
      EXECUTE format('drop policy if exists %I on public.%I',t||' phase36 editor all',t);
      EXECUTE format(
        'create policy %I on public.%I for all to authenticated using (public.is_content_editor()) with check (public.is_content_editor())',
        t||' phase36 editor all',t
      );
    END IF;
  END LOOP;
END $$;

-- التحقق من أن حساب لوحة التحكم يملك دور محرر محتوى
select public.is_content_editor() as current_user_can_edit;
