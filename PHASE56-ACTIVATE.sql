-- PHASE56: Safe public schedule helper; keep all legacy content unchanged.
-- First test on staging if possible. Requires PHASE55-WORKFLOW.sql.
create or replace function public.phase56_visible_ids(p_table text,p_ids uuid[])
returns uuid[]
language sql stable security definer
set search_path=public,pg_temp
as $$
 select coalesce(array_agg(i.id),array[]::uuid[])
 from unnest(coalesce(p_ids,array[]::uuid[])) as i(id)
 where p_table in ('articles','events')
 and (
   not exists (select 1 from public.editorial_workflow w where w.entity_table=p_table and w.entity_id=i.id)
   or exists (
      select 1 from public.editorial_workflow w
      where w.entity_table=p_table and w.entity_id=i.id
        and w.review_state='published'
        and (w.publish_from is null or w.publish_from <= now())
        and (w.publish_until is null or w.publish_until > now())
   )
 );
$$;
revoke all on function public.phase56_visible_ids(text,uuid[]) from public;
grant execute on function public.phase56_visible_ids(text,uuid[]) to anon,authenticated;
-- SECURITY NOTE: The helper only filters cards in selected public pages.
-- Do NOT rely on it to protect confidential drafts: enforce existing is_published/RLS policies.
