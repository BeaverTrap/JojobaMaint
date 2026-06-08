-- Feed sections: maintenance, landscaping, or both (shows in both filters).

insert into public.post_categories (slug, label, position) values
  ('both', 'Both', 3)
on conflict (slug) do nothing;

alter table public.articles
  add column if not exists feed_section text not null default 'maintenance'
  check (feed_section in ('maintenance', 'landscaping', 'both'));

comment on column public.articles.feed_section is
  'Which feed filters include this article (maintenance, landscaping, or both).';

-- Topic-based backfill for existing articles.
update public.articles
set feed_section = 'landscaping'
where feed_section = 'maintenance'
  and category in ('trees', 'park-grounds', 'landscaping');
