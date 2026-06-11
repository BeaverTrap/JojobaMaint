-- Onsite photos tied to a site (lot) or valve.

create table if not exists public.location_photos (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null check (entity_type in ('site', 'valve')),
  entity_key    text not null,
  image_url     text not null,
  caption       text,
  uploaded_by   uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists location_photos_entity_idx
  on public.location_photos (entity_type, entity_key, created_at desc);

comment on table public.location_photos is
  'Staff-uploaded photos for site profiles and valve detail pages.';

alter table public.location_photos enable row level security;

create policy "Location photos are publicly viewable"
  on public.location_photos for select
  to anon, authenticated
  using (true);

create policy "Authorized staff can insert location photos"
  on public.location_photos for insert
  to authenticated
  with check (public.is_authorized());

create policy "Authorized staff can update location photos"
  on public.location_photos for update
  to authenticated
  using (public.is_authorized())
  with check (public.is_authorized());

create policy "Authorized staff can delete location photos"
  on public.location_photos for delete
  to authenticated
  using (public.is_authorized());
