-- Maintenance assessments: transparent records for pipes, halls, big projects,
-- landscaping (lift week, rentals), cross-connection, pond work, etc.

create table if not exists public.maintenance_assessment_work_types (
  slug       text primary key,
  label      text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.maintenance_assessment_work_types (slug, label, position) values
  ('general', 'General maintenance', 1),
  ('big-project', 'Big project', 2),
  ('landscaping', 'Landscaping / grounds', 3),
  ('cross-connection', 'Cross-connection', 4),
  ('pond', 'Pond', 5),
  ('other', 'Other', 6)
on conflict (slug) do nothing;

alter table public.maintenance_assessment_work_types enable row level security;

create policy "Maintenance work types are publicly viewable"
  on public.maintenance_assessment_work_types for select
  to anon, authenticated
  using (true);

create table if not exists public.maintenance_assessment_issue_types (
  slug       text primary key,
  label      text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.maintenance_assessment_issue_types (slug, label, position) values
  ('routine', 'Routine repair / upkeep', 1),
  ('resident-report', 'Resident or staff report', 2),
  ('scheduled', 'Scheduled / planned work', 3),
  ('inspection', 'Inspection finding', 4),
  ('project-update', 'Project update', 5),
  ('equipment-rental', 'Equipment rental (lift, grinder, etc.)', 6),
  ('other', 'Other', 7)
on conflict (slug) do nothing;

alter table public.maintenance_assessment_issue_types enable row level security;

create policy "Maintenance issue types are publicly viewable"
  on public.maintenance_assessment_issue_types for select
  to anon, authenticated
  using (true);

create table if not exists public.maintenance_assessments (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  summary           text,
  body              text not null,
  reference_list    text,
  site_number       text,
  common_area       text,
  work_description  text not null,
  work_type         text not null default 'general'
    references public.maintenance_assessment_work_types (slug) on update cascade,
  issue_type        text not null default 'scheduled'
    references public.maintenance_assessment_issue_types (slug) on update cascade,
  how_found         text,
  resolution_status text,
  resolution_notes  text,
  cover_image_url   text,
  published         boolean not null default false,
  author_id         uuid not null references public.profiles (id) on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint maintenance_assessments_resolution_status_check
    check (
      resolution_status is null
      or resolution_status in (
        'open',
        'resolved',
        'partial',
        'monitoring',
        'not-applicable'
      )
    )
);

create index if not exists maintenance_assessments_published_idx
  on public.maintenance_assessments (published, created_at desc);
create index if not exists maintenance_assessments_site_idx
  on public.maintenance_assessments (site_number);
create index if not exists maintenance_assessments_work_type_idx
  on public.maintenance_assessments (work_type);
create index if not exists maintenance_assessments_issue_type_idx
  on public.maintenance_assessments (issue_type);

alter table public.maintenance_assessments enable row level security;

create policy "Published maintenance assessments are publicly viewable"
  on public.maintenance_assessments for select
  to anon, authenticated
  using (published = true);

create policy "Authorized users can view all maintenance assessments"
  on public.maintenance_assessments for select
  to authenticated
  using (public.is_authorized());

create policy "Authorized users can insert maintenance assessments"
  on public.maintenance_assessments for insert
  to authenticated
  with check (author_id = (select auth.uid()) and public.is_authorized());

create policy "Authorized users can update maintenance assessments"
  on public.maintenance_assessments for update
  to authenticated
  using (public.is_authorized())
  with check (public.is_authorized());

create policy "Authorized users can delete maintenance assessments"
  on public.maintenance_assessments for delete
  to authenticated
  using (public.is_authorized());

create or replace function public.maintenance_assessments_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists maintenance_assessments_set_updated_at on public.maintenance_assessments;
create trigger maintenance_assessments_set_updated_at
  before update on public.maintenance_assessments
  for each row execute function public.maintenance_assessments_set_updated_at();
