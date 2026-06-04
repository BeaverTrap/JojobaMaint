-- Feed only uses maintenance + landscaping. Remove extra sections that were added by mistake.

update public.posts
  set category = 'maintenance'
  where category in ('trees', 'pond', 'big-project', 'cross-connection');

delete from public.post_categories
  where slug in ('trees', 'pond', 'big-project', 'cross-connection');
