-- Building-level close toggle: closes all laundry + restrooms in one tap.
alter table public.park_facility_status
  add column if not exists closed boolean not null default false;

comment on column public.park_facility_status.closed is
  'When true, entire building is closed — all laundry, restrooms, and amenities show as unavailable.';
