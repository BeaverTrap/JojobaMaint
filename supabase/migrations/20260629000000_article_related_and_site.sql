-- Related article links and lot/site fields on articles.

alter table public.articles
  add column if not exists site_number text,
  add column if not exists common_area text;

create table if not exists public.article_related_links (
  article_id         uuid not null references public.articles (id) on delete cascade,
  related_article_id uuid not null references public.articles (id) on delete cascade,
  primary key (article_id, related_article_id),
  check (article_id != related_article_id)
);

create index if not exists article_related_links_article_idx
  on public.article_related_links (article_id);

alter table public.article_related_links enable row level security;

create policy "Article related links are publicly viewable"
  on public.article_related_links for select
  to anon, authenticated
  using (true);

create policy "Authorized users manage article related links"
  on public.article_related_links for all to authenticated
  using (public.is_authorized()) with check (public.is_authorized());
