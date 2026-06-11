-- Staff-editable map marker positions (runtime override for bundled map-positions.json).
-- Site types for lots directory: numeric lots, named sites, and map amenities.

create table if not exists public.park_map_positions (
  id         text primary key default 'default',
  lots       jsonb not null default '{}',
  places     jsonb not null default '{}',
  valves     jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

comment on table public.park_map_positions is
  'Map marker coordinates edited via /map/edit; public read, staff write via service role API.';

insert into public.park_map_positions (id)
values ('default')
on conflict (id) do nothing;

alter table public.park_map_positions enable row level security;

create policy "Map positions are publicly readable"
  on public.park_map_positions for select
  to anon, authenticated
  using (true);

alter table public.lots
  add column if not exists location_type text not null default 'lot';

alter table public.lots
  add column if not exists place_icon text;

comment on column public.lots.location_type is
  'lot = numbered site lot; site = named lot from map (e.g. Club House); amenity = facility icon from map places.';
