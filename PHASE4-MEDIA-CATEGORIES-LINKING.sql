-- PHASE 4: Media categories + optional direct linking
-- Safe: additive only; does not delete existing media.

alter table public.media add column if not exists linked_type text;
alter table public.media add column if not exists linked_id uuid;
create index if not exists media_category_idx on public.media(category);
create index if not exists media_link_idx on public.media(linked_type, linked_id);

-- Existing media remains valid. Linking is optional.
select column_name, data_type from information_schema.columns
where table_schema='public' and table_name='media'
  and column_name in ('category','linked_type','linked_id','alt_text','caption','storage_path')
order by column_name;
