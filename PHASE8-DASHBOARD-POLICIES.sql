-- PHASE8: صلاحيات لوحة الإدارة الموحدة. شغّل مرة واحدة بعد PHASE3/PHASE5.
-- لا يحذف هذا الملف أي بيانات.
do $$
declare t text;
begin
  foreach t in array array['diseases','services','articles','faqs','bookings'] loop
    if to_regclass('public.'||t) is not null then
      execute format('alter table public.%I enable row level security',t);
      execute format('drop policy if exists %I on public.%I',t||' editor read all',t);
      execute format('create policy %I on public.%I for select to authenticated using (public.is_content_editor())',t||' editor read all',t);
      execute format('drop policy if exists %I on public.%I',t||' editor insert',t);
      execute format('create policy %I on public.%I for insert to authenticated with check (public.is_content_editor())',t||' editor insert',t);
      execute format('drop policy if exists %I on public.%I',t||' editor update',t);
      execute format('create policy %I on public.%I for update to authenticated using (public.is_content_editor()) with check (public.is_content_editor())',t||' editor update',t);
      if t <> 'bookings' then
        execute format('drop policy if exists %I on public.%I',t||' editor delete',t);
        execute format('create policy %I on public.%I for delete to authenticated using (public.is_content_editor())',t||' editor delete',t);
      end if;
    end if;
  end loop;
end $$;
