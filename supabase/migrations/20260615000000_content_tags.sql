-- Shared topic tags for articles, posts, and assessments (maintenance + landscaping).

create table if not exists public.content_tags (
  slug       text primary key,
  label      text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.content_tags (slug, label, position) values
  ('trees', 'Trees', 10),
  ('pruning', 'Pruning & trimming', 11),
  ('removal', 'Tree removal', 12),
  ('planting', 'Planting', 13),
  ('pest-disease', 'Pest & disease', 14),
  ('irrigation', 'Irrigation', 15),
  ('park-grounds', 'Park & grounds', 16),
  ('landscaping', 'Landscaping / grounds', 17),
  ('plumbing', 'Plumbing', 20),
  ('electrical', 'Electrical', 21),
  ('hvac', 'HVAC', 22),
  ('buildings', 'Buildings & halls', 23),
  ('roads-paving', 'Roads & paving', 24),
  ('pond', 'Pond', 25),
  ('pool-spa', 'Pool / spa', 26),
  ('big-project', 'Big project', 27),
  ('cross-connection', 'Cross-connection', 28),
  ('equipment', 'Equipment & rentals', 29),
  ('safety', 'Safety', 30),
  ('utilities', 'Utilities', 31),
  ('waste-cleanup', 'Waste & cleanup', 32),
  ('best-practices', 'Best practices', 40),
  ('how-to', 'How-to / guide', 41),
  ('policy', 'Policy & rules', 42),
  ('resident-inquiry', 'Resident inquiry', 50),
  ('damage', 'Damage', 51),
  ('inspection', 'Inspection', 52),
  ('routine', 'Routine upkeep', 53),
  ('scheduled', 'Scheduled work', 54),
  ('project-update', 'Project update', 55),
  ('monitoring', 'Monitoring', 56),
  ('other', 'Other', 99)
on conflict (slug) do nothing;

alter table public.content_tags enable row level security;

create policy "Content tags are publicly viewable"
  on public.content_tags for select
  to anon, authenticated
  using (true);

-- Junction tables (many tags per item)

create table if not exists public.article_tag_links (
  article_id uuid not null references public.articles (id) on delete cascade,
  tag_slug   text not null references public.content_tags (slug) on update cascade,
  primary key (article_id, tag_slug)
);

create table if not exists public.post_tag_links (
  post_id  uuid not null references public.posts (id) on delete cascade,
  tag_slug text not null references public.content_tags (slug) on update cascade,
  primary key (post_id, tag_slug)
);

create table if not exists public.tree_assessment_tag_links (
  assessment_id uuid not null references public.tree_assessments (id) on delete cascade,
  tag_slug      text not null references public.content_tags (slug) on update cascade,
  primary key (assessment_id, tag_slug)
);

create table if not exists public.maintenance_assessment_tag_links (
  assessment_id uuid not null references public.maintenance_assessments (id) on delete cascade,
  tag_slug      text not null references public.content_tags (slug) on update cascade,
  primary key (assessment_id, tag_slug)
);

create index if not exists article_tag_links_tag_idx on public.article_tag_links (tag_slug);
create index if not exists post_tag_links_tag_idx on public.post_tag_links (tag_slug);
create index if not exists tree_assessment_tag_links_tag_idx
  on public.tree_assessment_tag_links (tag_slug);
create index if not exists maintenance_assessment_tag_links_tag_idx
  on public.maintenance_assessment_tag_links (tag_slug);

alter table public.article_tag_links enable row level security;
alter table public.post_tag_links enable row level security;
alter table public.tree_assessment_tag_links enable row level security;
alter table public.maintenance_assessment_tag_links enable row level security;

create policy "Article tag links are publicly viewable"
  on public.article_tag_links for select to anon, authenticated using (true);
create policy "Post tag links are publicly viewable"
  on public.post_tag_links for select to anon, authenticated using (true);
create policy "Tree assessment tag links are publicly viewable"
  on public.tree_assessment_tag_links for select to anon, authenticated using (true);
create policy "Maintenance assessment tag links are publicly viewable"
  on public.maintenance_assessment_tag_links for select to anon, authenticated using (true);

create policy "Authorized users manage article tag links"
  on public.article_tag_links for all to authenticated
  using (public.is_authorized()) with check (public.is_authorized());
create policy "Authorized users manage post tag links"
  on public.post_tag_links for all to authenticated
  using (public.is_authorized()) with check (public.is_authorized());
create policy "Authorized users manage tree assessment tag links"
  on public.tree_assessment_tag_links for all to authenticated
  using (public.is_authorized()) with check (public.is_authorized());
create policy "Authorized users manage maintenance assessment tag links"
  on public.maintenance_assessment_tag_links for all to authenticated
  using (public.is_authorized()) with check (public.is_authorized());

-- Backfill from legacy single-select fields
insert into public.article_tag_links (article_id, tag_slug)
select id, category from public.articles
where category is not null
on conflict do nothing;

insert into public.tree_assessment_tag_links (assessment_id, tag_slug)
select id, concern_type from public.tree_assessments
where concern_type is not null
  and concern_type in (select slug from public.content_tags)
on conflict do nothing;

insert into public.maintenance_assessment_tag_links (assessment_id, tag_slug)
select id, work_type from public.maintenance_assessments
where work_type is not null
  and work_type in (select slug from public.content_tags)
on conflict do nothing;

insert into public.maintenance_assessment_tag_links (assessment_id, tag_slug)
select id, issue_type from public.maintenance_assessments
where issue_type is not null
  and issue_type in (select slug from public.content_tags)
on conflict do nothing;

-- Map assessment-only slugs that differ from tag slugs
insert into public.content_tags (slug, label, position) values
  ('health', 'Health assessment', 14),
  ('general', 'General maintenance', 19),
  ('resident-report', 'Resident or staff report', 57)
on conflict (slug) do nothing;

insert into public.tree_assessment_tag_links (assessment_id, tag_slug)
select id, concern_type from public.tree_assessments
where concern_type in ('health', 'resident-inquiry', 'damage', 'pruning', 'removal', 'other')
on conflict do nothing;

insert into public.maintenance_assessment_tag_links (assessment_id, tag_slug)
select id, work_type from public.maintenance_assessments
where work_type in ('general', 'big-project', 'landscaping', 'cross-connection', 'pond', 'other')
on conflict do nothing;

insert into public.maintenance_assessment_tag_links (assessment_id, tag_slug)
select id, issue_type from public.maintenance_assessments
where issue_type in ('routine', 'resident-report', 'scheduled', 'inspection', 'project-update', 'equipment', 'other')
on conflict do nothing;
