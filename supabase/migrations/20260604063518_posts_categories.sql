-- Post categories / sections (extensible reference table + FK)

create table if not exists public.post_categories (
  slug       text primary key,
  label      text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.post_categories (slug, label, position) values
  ('maintenance', 'Maintenance', 1),
  ('landscaping', 'Landscaping', 2)
on conflict (slug) do nothing;

alter table public.post_categories enable row level security;

-- Public read so the feed can render the filter tabs; writes via SQL/dashboard only.
create policy "Post categories are publicly viewable"
  on public.post_categories for select
  to anon, authenticated
  using (true);

-- Add the category column (defaults existing + new posts to 'maintenance').
alter table public.posts
  add column if not exists category text not null default 'maintenance'
  references public.post_categories (slug) on update cascade;

create index if not exists posts_category_idx on public.posts (category);
