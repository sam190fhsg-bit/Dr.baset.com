-- PHASE60: OPTIONAL, requires backup and verifying existing SELECT policies first.
-- Applies additional restrictions for ANONYMOUS visitors only.
-- Old published records without workflow rows remain visible.
-- Review policies for authenticated non-editor visitors separately.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['articles','events'] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE EXCEPTION 'Missing table %', t;
    END IF;
  END LOOP;
END $$;

DROP POLICY IF EXISTS phase60_public_workflow_guard ON public.articles;
CREATE POLICY phase60_public_workflow_guard ON public.articles
AS RESTRICTIVE FOR SELECT TO anon
USING (is_published IS TRUE AND public.phase55_visible('articles', id));

DROP POLICY IF EXISTS phase60_public_workflow_guard ON public.events;
CREATE POLICY phase60_public_workflow_guard ON public.events
AS RESTRICTIVE FOR SELECT TO anon
USING (is_published IS TRUE AND public.phase55_visible('events', id));

-- NOTE: Existing permissive SELECT policies must permit visible published rows.
-- RLS policies on authenticated role and other tables must be audited separately.
