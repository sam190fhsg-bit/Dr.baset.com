-- PHASE54: Run manually in Supabase SQL Editor after backing up your database.
-- History of PUBLIC EDITORIAL CONTENT ONLY; no patient bookings, contacts or private messages.
create table if not exists public.editorial_history (
 id bigint generated always as identity primary key,
 entity_table text not null,
 entity_id uuid not null,
 operation text not null check(operation in ('INSERT','UPDATE','DELETE')),
 before_data jsonb,
 after_data jsonb,
 changed_by uuid default auth.uid(),
 changed_at timestamptz not null default now()
);
create index if not exists editorial_history_item_idx on public.editorial_history(entity_table,entity_id,changed_at desc);
create index if not exists editorial_history_time_idx on public.editorial_history(changed_at desc);
alter table public.editorial_history enable row level security;
revoke all on public.editorial_history from anon,authenticated;
grant select on public.editorial_history to authenticated;
-- Reuse the site's existing editor permission function.
drop policy if exists "phase54 history read" on public.editorial_history;
create policy "phase54 history read" on public.editorial_history for select to authenticated
 using (public.is_content_editor());
create or replace function public.phase54_log_editorial()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
 insert into public.editorial_history(entity_table,entity_id,operation,before_data,after_data,changed_by)
 values (TG_TABLE_NAME, coalesce(new.id,old.id),TG_OP,
 case when TG_OP in ('UPDATE','DELETE') then to_jsonb(old) else null end,
 case when TG_OP in ('UPDATE','INSERT') then to_jsonb(new) else null end,
 auth.uid());
 return coalesce(new,old);
end $$;
-- Protect only editorial data. Do not install on patient bookings.
do $$ declare t text; begin
 foreach t in array array['articles','diseases','services','events','videos'] loop
  if to_regclass('public.'||t) is not null then
   execute format('drop trigger if exists phase54_history on public.%I',t);
   execute format('create trigger phase54_history after insert or update or delete on public.%I for each row execute function public.phase54_log_editorial()',t);
  end if;
 end loop;
end $$;
