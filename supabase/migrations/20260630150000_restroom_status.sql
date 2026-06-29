-- Restroom / shower status for the home dashboard (manual updates by managers).

create table if not exists public.restroom_location_status (
  id                    text primary key,
  label                 text not null,
  shower_count          int not null check (shower_count > 0),
  stall_count           int not null check (stall_count > 0),
  showers_out_of_order  int not null default 0 check (showers_out_of_order >= 0),
  stalls_out_of_order   int not null default 0 check (stalls_out_of_order >= 0),
  note                  text,
  updated_by            uuid references public.profiles (id) on delete set null,
  updated_at            timestamptz not null default now(),
  constraint restroom_showers_ooo_lte_count
    check (showers_out_of_order <= shower_count),
  constraint restroom_stalls_ooo_lte_count
    check (stalls_out_of_order <= stall_count)
);

insert into public.restroom_location_status (
  id, label, shower_count, stall_count
) values
  ('west', 'West Restrooms', 4, 6),
  ('east', 'East Restrooms', 4, 6),
  ('boondocks', 'Boondocks Restrooms', 2, 4),
  ('friendship_hall', 'Friendship Hall Restrooms', 4, 6)
on conflict (id) do nothing;

alter table public.restroom_location_status enable row level security;

create policy "Restroom status is publicly viewable"
  on public.restroom_location_status for select
  to anon, authenticated
  using (true);

create policy "Managers can update restroom status"
  on public.restroom_location_status for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (public.has_staff_role('manager'::public.staff_role));

drop trigger if exists restroom_location_status_set_updated_at
  on public.restroom_location_status;
create trigger restroom_location_status_set_updated_at
  before update on public.restroom_location_status
  for each row execute function public.set_updated_at();
