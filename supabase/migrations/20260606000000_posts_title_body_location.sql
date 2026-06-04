-- Posts: title, body, and optional location fields.

alter table public.posts
  add column if not exists title text,
  add column if not exists body text not null default '',
  add column if not exists site_number text,
  add column if not exists common_area text;

-- Backfill title/body from legacy description (first line = title, rest = body).
update public.posts
set
  title = coalesce(
    nullif(trim(split_part(description, E'\n', 1)), ''),
    left(description, 200)
  ),
  body = coalesce(
    nullif(
      trim(
        substring(
          description
          from length(split_part(description, E'\n', 1)) + 1
        )
      ),
      ''
    ),
    ''
  )
where title is null;

alter table public.posts
  alter column title set not null;

create index if not exists posts_title_idx on public.posts (title);
