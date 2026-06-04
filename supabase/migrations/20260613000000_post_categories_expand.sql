-- Expand feed sections so staff can tag all types of work; feed "All" still shows every post.

insert into public.post_categories (slug, label, position) values
  ('trees', 'Trees & plants', 3),
  ('pond', 'Pond', 4),
  ('big-project', 'Big project', 5),
  ('cross-connection', 'Cross-connection', 6)
on conflict (slug) do update set
  label = excluded.label,
  position = excluded.position;

update public.post_categories set position = 1, label = 'Maintenance' where slug = 'maintenance';
update public.post_categories set position = 2, label = 'Landscaping' where slug = 'landscaping';
