-- Laundry room machine status for the home dashboard (manual updates by managers).

create table if not exists public.laundry_location_status (
  id                    text primary key,
  label                 text not null,
  washer_count          int not null check (washer_count > 0),
  dryer_count           int not null check (dryer_count > 0),
  washers_out_of_order  int not null default 0 check (washers_out_of_order >= 0),
  dryers_out_of_order   int not null default 0 check (dryers_out_of_order >= 0),
  note                  text,
  updated_by            uuid references public.profiles (id) on delete set null,
  updated_at            timestamptz not null default now(),
  constraint laundry_washers_ooo_lte_count
    check (washers_out_of_order <= washer_count),
  constraint laundry_dryers_ooo_lte_count
    check (dryers_out_of_order <= dryer_count)
);

insert into public.laundry_location_status (
  id, label, washer_count, dryer_count
) values
  ('west', 'West Laundry', 6, 6),
  ('east', 'East Laundry', 6, 6),
  ('boondocks', 'Boondocks Laundry', 4, 4),
  ('friendship_hall', 'Friendship Hall Laundry', 6, 6)
on conflict (id) do nothing;

alter table public.laundry_location_status enable row level security;

create policy "Laundry status is publicly viewable"
  on public.laundry_location_status for select
  to anon, authenticated
  using (true);

create policy "Managers can update laundry status"
  on public.laundry_location_status for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (public.has_staff_role('manager'::public.staff_role));

drop trigger if exists laundry_location_status_set_updated_at
  on public.laundry_location_status;
create trigger laundry_location_status_set_updated_at
  before update on public.laundry_location_status
  for each row execute function public.set_updated_at();
