-- Track each physical unit individually (ok / out) instead of aggregate counts.
-- Restrooms can also be marked closed as a whole.

create or replace function public.build_unit_statuses(cnt int, ooo int)
returns jsonb
language sql
immutable
as $$
  select case
    when cnt <= 0 then '[]'::jsonb
    else (
      select jsonb_agg(
        case
          when i <= greatest(0, least(ooo, cnt)) then 'out'
          else 'ok'
        end
        order by i
      )
      from generate_series(1, cnt) as i
    )
  end;
$$;

alter table public.park_facility_status
  add column if not exists washer_statuses jsonb not null default '[]',
  add column if not exists dryer_statuses jsonb not null default '[]',
  add column if not exists pet_washer_statuses jsonb not null default '[]',
  add column if not exists water_heater_statuses jsonb not null default '[]',
  add column if not exists kitchen_sink_statuses jsonb not null default '[]',
  add column if not exists oven_statuses jsonb not null default '[]';

update public.park_facility_status
set
  washer_statuses = public.build_unit_statuses(washer_count, washers_out_of_order),
  dryer_statuses = public.build_unit_statuses(dryer_count, dryers_out_of_order),
  pet_washer_statuses = public.build_unit_statuses(pet_washer_count, pet_washers_out_of_order),
  water_heater_statuses = public.build_unit_statuses(water_heater_count, water_heaters_out_of_order),
  kitchen_sink_statuses = public.build_unit_statuses(kitchen_sink_count, kitchen_sinks_out_of_order),
  oven_statuses = public.build_unit_statuses(oven_count, ovens_out_of_order);

alter table public.park_facility_status
  drop column if exists washers_out_of_order,
  drop column if exists dryers_out_of_order,
  drop column if exists pet_washers_out_of_order,
  drop column if exists water_heaters_out_of_order,
  drop column if exists kitchen_sinks_out_of_order,
  drop column if exists ovens_out_of_order;

alter table public.park_restroom_status
  add column if not exists shower_statuses jsonb not null default '[]',
  add column if not exists stall_statuses jsonb not null default '[]',
  add column if not exists urinal_statuses jsonb not null default '[]',
  add column if not exists sink_statuses jsonb not null default '[]',
  add column if not exists closed boolean not null default false;

update public.park_restroom_status
set
  shower_statuses = public.build_unit_statuses(shower_count, showers_out_of_order),
  stall_statuses = public.build_unit_statuses(stall_count, stalls_out_of_order),
  urinal_statuses = public.build_unit_statuses(urinal_count, urinals_out_of_order),
  sink_statuses = public.build_unit_statuses(sink_count, sinks_out_of_order);

alter table public.park_restroom_status
  drop column if exists showers_out_of_order,
  drop column if exists stalls_out_of_order,
  drop column if exists urinals_out_of_order,
  drop column if exists sinks_out_of_order;
