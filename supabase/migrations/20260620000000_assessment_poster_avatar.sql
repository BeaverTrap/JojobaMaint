-- Crew icon on assessments (landscaping vs maintenance), same as posts.

alter table public.tree_assessments
  add column if not exists poster_avatar text not null default 'landscaping-sky';

alter table public.maintenance_assessments
  add column if not exists poster_avatar text not null default 'maintenance-sky';

comment on column public.tree_assessments.poster_avatar is
  'Landscaping crew quail slug from public/avatars.';

comment on column public.maintenance_assessments.poster_avatar is
  'Maintenance crew quail slug from public/avatars.';
