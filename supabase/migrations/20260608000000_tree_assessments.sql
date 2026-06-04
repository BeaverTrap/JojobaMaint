-- Tree assessments: transparent lot-specific tree/plant evaluations (public when published).

create table if not exists public.tree_assessment_concerns (
  slug       text primary key,
  label      text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.tree_assessment_concerns (slug, label, position) values
  ('damage', 'Damage', 1),
  ('resident-inquiry', 'Resident inquiry', 2),
  ('health', 'Health assessment', 3),
  ('pruning', 'Pruning / trimming', 4),
  ('removal', 'Removal recommendation', 5),
  ('other', 'Other', 6)
on conflict (slug) do nothing;

alter table public.tree_assessment_concerns enable row level security;

create policy "Tree assessment concerns are publicly viewable"
  on public.tree_assessment_concerns for select
  to anon, authenticated
  using (true);

create table if not exists public.tree_assessments (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  summary           text,
  body              text not null,
  site_number       text not null,
  tree_description  text not null,
  plant_type        text,
  concern_type      text not null default 'resident-inquiry'
    references public.tree_assessment_concerns (slug) on update cascade,
  resident_note     text,
  cover_image_url   text,
  published         boolean not null default false,
  author_id         uuid not null references public.profiles (id) on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists tree_assessments_published_idx
  on public.tree_assessments (published, created_at desc);
create index if not exists tree_assessments_site_idx
  on public.tree_assessments (site_number);
create index if not exists tree_assessments_concern_idx
  on public.tree_assessments (concern_type);

alter table public.tree_assessments enable row level security;

create policy "Published tree assessments are publicly viewable"
  on public.tree_assessments for select
  to anon, authenticated
  using (published = true);

create policy "Authorized users can view all tree assessments"
  on public.tree_assessments for select
  to authenticated
  using (public.is_authorized());

create policy "Authorized users can insert tree assessments"
  on public.tree_assessments for insert
  to authenticated
  with check (author_id = (select auth.uid()) and public.is_authorized());

create policy "Authorized users can update tree assessments"
  on public.tree_assessments for update
  to authenticated
  using (public.is_authorized())
  with check (public.is_authorized());

create policy "Authorized users can delete tree assessments"
  on public.tree_assessments for delete
  to authenticated
  using (public.is_authorized());

create or replace function public.tree_assessments_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tree_assessments_set_updated_at on public.tree_assessments;
create trigger tree_assessments_set_updated_at
  before update on public.tree_assessments
  for each row execute function public.tree_assessments_set_updated_at();
