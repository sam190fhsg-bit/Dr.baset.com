-- PHASE55: review, scheduling, archiving metadata; run after a tested backup.
-- Does not modify existing publications or patient data.
create table if not exists public.editorial_workflow (
 entity_table text not null check (entity_table in ('articles','diseases','services','events','videos')),
 entity_id uuid not null,
 review_state text not null default 'draft' check(review_state in ('draft','medical_review','approved','published','archived')),
 publish_from timestamptz,
 publish_until timestamptz,
 reviewer_notes text not null default '',
 updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now(),
 primary key(entity_table,entity_id),
 constraint phase55_window check(publish_until is null or publish_from is null or publish_until > publish_from)
);
create index if not exists phase55_workflow_state_idx on public.editorial_workflow(review_state,publish_from,publish_until);
alter table public.editorial_workflow enable row level security;
revoke all on public.editorial_workflow from anon,authenticated;
grant select,insert,update on public.editorial_workflow to authenticated;
drop policy if exists "phase55 read editors" on public.editorial_workflow;
create policy "phase55 read editors" on public.editorial_workflow for select to authenticated using(public.is_content_editor());
drop policy if exists "phase55 insert editors" on public.editorial_workflow;
create policy "phase55 insert editors" on public.editorial_workflow for insert to authenticated with check(public.is_content_editor());
drop policy if exists "phase55 update editors" on public.editorial_workflow;
create policy "phase55 update editors" on public.editorial_workflow for update to authenticated using(public.is_content_editor()) with check(public.is_content_editor());
-- Public may read only currently approved + scheduled records, plus absence of a workflow row.
create or replace function public.phase55_visible(p_table text,p_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select not exists (select 1 from public.editorial_workflow w where w.entity_table=p_table and w.entity_id=p_id)
 or exists (select 1 from public.editorial_workflow w where w.entity_table=p_table and w.entity_id=p_id
  and w.review_state='published' and (w.publish_from is null or w.publish_from<=now())
  and (w.publish_until is null or w.publish_until>now()));
$$;
revoke all on function public.phase55_visible(text,uuid) from public;
grant execute on function public.phase55_visible(text,uuid) to anon,authenticated;
-- Important: this function is used in public pages as an additional UI filter.
-- For enforced privacy, review and integrate it into the existing table RLS SELECT policies separately.
