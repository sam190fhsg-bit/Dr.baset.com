-- PHASE38: صلاحيات التحكم الكامل في ظهور المحتوى والفعاليات
-- لا يحذف أي بيانات.

alter table public.diseases enable row level security;
alter table public.articles enable row level security;
alter table public.events enable row level security;

grant select on public.diseases, public.articles, public.events to anon, authenticated;
grant insert, update, delete on public.diseases, public.articles, public.events to authenticated;

do $$
declare t text;
begin
  foreach t in array array['diseases','articles','events'] loop
    execute format('drop policy if exists %I on public.%I', t||' editor full control', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_content_editor()) with check (public.is_content_editor())', t||' editor full control', t);
  end loop;
end $$;
