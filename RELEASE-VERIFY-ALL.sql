-- FINAL RELEASE: READ-ONLY verification. Safe to run in Supabase SQL Editor.
-- No data or permissions will be changed.
SELECT 'editorial_history' AS component, (to_regclass('public.editorial_history') IS NOT NULL)::text AS present
UNION ALL SELECT 'editorial_workflow', (to_regclass('public.editorial_workflow') IS NOT NULL)::text
UNION ALL SELECT 'site_campaigns', (to_regclass('public.site_campaigns') IS NOT NULL)::text
UNION ALL SELECT 'articles', (to_regclass('public.articles') IS NOT NULL)::text
UNION ALL SELECT 'diseases', (to_regclass('public.diseases') IS NOT NULL)::text
UNION ALL SELECT 'events', (to_regclass('public.events') IS NOT NULL)::text
UNION ALL SELECT 'bookings', (to_regclass('public.bookings') IS NOT NULL)::text
UNION ALL SELECT 'phase55_visible', (to_regprocedure('public.phase55_visible(text,uuid)') IS NOT NULL)::text
UNION ALL SELECT 'phase56_visible_ids', (to_regprocedure('public.phase56_visible_ids(text,uuid[])') IS NOT NULL)::text
UNION ALL SELECT 'site-media public bucket', coalesce((SELECT public::text FROM storage.buckets WHERE id='site-media'),'false')
ORDER BY component;

-- Existing SELECT policies (review; these rows alone do not prove correct enforcement).
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('articles','events','editorial_workflow','editorial_history','site_campaigns','bookings')
ORDER BY tablename, policyname;
