-- Articles / knowledge base (separate from the job feed)

create table if not exists public.article_categories (
  slug       text primary key,
  label      text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.article_categories (slug, label, position) values
  ('trees', 'Trees', 1),
  ('best-practices', 'Best practices', 2),
  ('park-grounds', 'Park & grounds', 3)
on conflict (slug) do nothing;

alter table public.article_categories enable row level security;

create policy "Article categories are publicly viewable"
  on public.article_categories for select
  to anon, authenticated
  using (true);

create table if not exists public.articles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  summary         text,
  body            text not null,
  category        text not null default 'trees'
    references public.article_categories (slug) on update cascade,
  cover_image_url text,
  published       boolean not null default false,
  author_id       uuid not null references public.profiles (id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists articles_published_idx on public.articles (published, created_at desc);
create index if not exists articles_category_idx on public.articles (category);
create index if not exists articles_slug_idx on public.articles (slug);

alter table public.articles enable row level security;

-- Visitors see published articles only.
create policy "Published articles are publicly viewable"
  on public.articles for select
  to anon, authenticated
  using (published = true);

-- Staff can read drafts too.
create policy "Authorized users can view all articles"
  on public.articles for select
  to authenticated
  using (public.is_authorized());

create policy "Authorized users can insert articles"
  on public.articles for insert
  to authenticated
  with check (author_id = (select auth.uid()) and public.is_authorized());

create policy "Authorized users can update articles"
  on public.articles for update
  to authenticated
  using (public.is_authorized())
  with check (public.is_authorized());

create policy "Authorized users can delete articles"
  on public.articles for delete
  to authenticated
  using (public.is_authorized());

create or replace function public.articles_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.articles_set_updated_at();
