-- Park buildings: laundry lives on the building, restrooms are individual rooms.
-- Buildings: West Laundry, East Laundry, Boondocks, Friendship Hall, Office & Ranch House.

drop table if exists public.laundry_location_status cascade;
drop table if exists public.restroom_location_status cascade;
drop table if exists public.park_restroom_status cascade;
drop table if exists public.park_facility_status cascade;

create table public.park_facility_status (
  id                    text primary key,
  label                 text not null,
  sort_order            int not null default 0,
  washer_count          int not null default 0 check (washer_count >= 0),
  dryer_count           int not null default 0 check (dryer_count >= 0),
  pet_washer_count      int not null default 0 check (pet_washer_count >= 0),
  water_heater_count    int not null default 0 check (water_heater_count >= 0),
  kitchen_sink_count    int not null default 0 check (kitchen_sink_count >= 0),
  oven_count            int not null default 0 check (oven_count >= 0),
  washers_out_of_order  int not null default 0 check (washers_out_of_order >= 0),
  dryers_out_of_order   int not null default 0 check (dryers_out_of_order >= 0),
  pet_washers_out_of_order int not null default 0 check (pet_washers_out_of_order >= 0),
  water_heaters_out_of_order int not null default 0 check (water_heaters_out_of_order >= 0),
  kitchen_sinks_out_of_order int not null default 0 check (kitchen_sinks_out_of_order >= 0),
  ovens_out_of_order    int not null default 0 check (ovens_out_of_order >= 0),
  laundry_note          text,
  pet_washer_note       text,
  water_heater_note     text,
  kitchen_note          text,
  note                  text,
  updated_by            uuid references public.profiles (id) on delete set null,
  updated_at            timestamptz not null default now(),
  constraint park_facility_washers_ooo_lte_count
    check (washers_out_of_order <= washer_count),
  constraint park_facility_dryers_ooo_lte_count
    check (dryers_out_of_order <= dryer_count),
  constraint park_facility_pet_washers_ooo_lte_count
    check (pet_washers_out_of_order <= pet_washer_count),
  constraint park_facility_water_heaters_ooo_lte_count
    check (water_heaters_out_of_order <= water_heater_count),
  constraint park_facility_kitchen_sinks_ooo_lte_count
    check (kitchen_sinks_out_of_order <= kitchen_sink_count),
  constraint park_facility_ovens_ooo_lte_count
    check (ovens_out_of_order <= oven_count)
);

create table public.park_restroom_status (
  id                    text primary key,
  building_id           text not null references public.park_facility_status (id) on delete cascade,
  label                 text not null,
  sort_order            int not null default 0,
  shower_count          int not null default 0 check (shower_count >= 0),
  stall_count           int not null default 0 check (stall_count >= 0),
  urinal_count          int not null default 0 check (urinal_count >= 0),
  sink_count            int not null default 0 check (sink_count >= 0),
  showers_out_of_order  int not null default 0 check (showers_out_of_order >= 0),
  stalls_out_of_order   int not null default 0 check (stalls_out_of_order >= 0),
  urinals_out_of_order  int not null default 0 check (urinals_out_of_order >= 0),
  sinks_out_of_order    int not null default 0 check (sinks_out_of_order >= 0),
  note                  text,
  updated_by            uuid references public.profiles (id) on delete set null,
  updated_at            timestamptz not null default now(),
  constraint park_restroom_showers_ooo_lte_count
    check (showers_out_of_order <= shower_count),
  constraint park_restroom_stalls_ooo_lte_count
    check (stalls_out_of_order <= stall_count),
  constraint park_restroom_urinals_ooo_lte_count
    check (urinals_out_of_order <= urinal_count),
  constraint park_restroom_sinks_ooo_lte_count
    check (sinks_out_of_order <= sink_count)
);

create index park_restroom_status_building_idx
  on public.park_restroom_status (building_id);

insert into public.park_facility_status (
  id,
  label,
  sort_order,
  washer_count,
  dryer_count,
  pet_washer_count,
  water_heater_count,
  kitchen_sink_count,
  oven_count
) values
  ('west', 'West Laundry', 1, 6, 6, 1, 1, 0, 0),
  ('east', 'East Laundry', 2, 6, 6, 1, 1, 0, 0),
  ('boondocks', 'Boondocks', 3, 4, 4, 0, 1, 0, 0),
  ('friendship_hall', 'Friendship Hall', 4, 6, 6, 0, 1, 0, 0),
  ('office_ranch', 'Office & Ranch House', 5, 0, 0, 0, 1, 1, 1)
on conflict (id) do nothing;

insert into public.park_restroom_status (
  id, building_id, label, sort_order, shower_count, stall_count, urinal_count, sink_count
) values
  -- West: one men's, one women's
  ('west_mens', 'west', 'Men''s', 1, 2, 2, 0, 2),
  ('west_womens', 'west', 'Women''s', 2, 2, 2, 0, 2),
  -- East: one men's, one women's
  ('east_mens', 'east', 'Men''s', 1, 2, 2, 0, 2),
  ('east_womens', 'east', 'Women''s', 2, 2, 2, 0, 2),
  -- Boondocks: one men's, one women's
  ('boondocks_mens', 'boondocks', 'Men''s', 1, 1, 1, 0, 1),
  ('boondocks_womens', 'boondocks', 'Women''s', 2, 1, 1, 0, 1),
  -- Friendship Hall: two men's, two women's (women's estimated)
  ('fh_mens_1', 'friendship_hall', 'Men''s — Room 1', 1, 0, 1, 1, 2),
  ('fh_mens_2', 'friendship_hall', 'Men''s — Room 2', 2, 3, 1, 1, 2),
  ('fh_womens_1', 'friendship_hall', 'Women''s — Room 1', 3, 0, 2, 0, 2),
  ('fh_womens_2', 'friendship_hall', 'Women''s — Room 2', 4, 3, 2, 0, 2),
  -- Office & Ranch House: connected building, restrooms only (no showers)
  ('office_restroom', 'office_ranch', 'Office bathroom', 1, 0, 1, 0, 1),
  ('ranch_house_restroom', 'office_ranch', 'Ranch House bathroom', 2, 0, 1, 0, 1)
on conflict (id) do nothing;

alter table public.park_facility_status enable row level security;
alter table public.park_restroom_status enable row level security;

create policy "Park facility status is publicly viewable"
  on public.park_facility_status for select
  to anon, authenticated
  using (true);

create policy "Managers can update park facility status"
  on public.park_facility_status for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (public.has_staff_role('manager'::public.staff_role));

create policy "Park restroom status is publicly viewable"
  on public.park_restroom_status for select
  to anon, authenticated
  using (true);

create policy "Managers can update park restroom status"
  on public.park_restroom_status for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (public.has_staff_role('manager'::public.staff_role));

drop trigger if exists park_facility_status_set_updated_at
  on public.park_facility_status;
create trigger park_facility_status_set_updated_at
  before update on public.park_facility_status
  for each row execute function public.set_updated_at();

drop trigger if exists park_restroom_status_set_updated_at
  on public.park_restroom_status;
create trigger park_restroom_status_set_updated_at
  before update on public.park_restroom_status
  for each row execute function public.set_updated_at();
