-- PHASE35: إصلاح صلاحيات التعديل والحذف في لوحة الإدارة
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor بحساب مالك المشروع.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['diseases','services','articles','faqs'] LOOP
    EXECUTE format('alter table public.%I enable row level security',t);
    EXECUTE format('drop policy if exists %I on public.%I',t||' editor read all',t);
    EXECUTE format('drop policy if exists %I on public.%I',t||' editor insert',t);
    EXECUTE format('drop policy if exists %I on public.%I',t||' editor update',t);
    EXECUTE format('drop policy if exists %I on public.%I',t||' editor delete',t);
    EXECUTE format('create policy %I on public.%I for select to authenticated using (public.is_content_editor())',t||' editor read all',t);
    EXECUTE format('create policy %I on public.%I for insert to authenticated with check (public.is_content_editor())',t||' editor insert',t);
    EXECUTE format('create policy %I on public.%I for update to authenticated using (public.is_content_editor()) with check (public.is_content_editor())',t||' editor update',t);
    EXECUTE format('create policy %I on public.%I for delete to authenticated using (public.is_content_editor())',t||' editor delete',t);
  END LOOP;
END $$;
