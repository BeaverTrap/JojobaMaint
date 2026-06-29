-- Park utility status panels (water + power) for the home dashboard.

create table if not exists public.water_system_status (
  id                  text primary key default 'default',
  supply_mode         text not null default 'full_pressure'
    check (supply_mode in ('gravity', 'full_pressure')),
  status              text not null default 'normal'
    check (status in ('normal', 'active_shutoff', 'planned_shutoff')),
  affected_areas      text,
  note                text,
  expected_restore_at timestamptz,
  updated_by          uuid references public.profiles (id) on delete set null,
  updated_at          timestamptz not null default now()
);

insert into public.water_system_status (id) values ('default')
on conflict (id) do nothing;

alter table public.water_system_status enable row level security;

create policy "Water status is publicly viewable"
  on public.water_system_status for select
  to anon, authenticated
  using (true);

create policy "Managers can update water status"
  on public.water_system_status for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (public.has_staff_role('manager'::public.staff_role));

drop trigger if exists water_system_status_set_updated_at on public.water_system_status;
create trigger water_system_status_set_updated_at
  before update on public.water_system_status
  for each row execute function public.set_updated_at();

create table if not exists public.power_status (
  id                  text primary key default 'default',
  status              text not null default 'normal'
    check (status in ('normal', 'outage', 'planned')),
  note                text,
  expected_restore_at timestamptz,
  updated_by          uuid references public.profiles (id) on delete set null,
  updated_at          timestamptz not null default now()
);

insert into public.power_status (id) values ('default')
on conflict (id) do nothing;

alter table public.power_status enable row level security;

create policy "Power status is publicly viewable"
  on public.power_status for select
  to anon, authenticated
  using (true);

create policy "Managers can update power status"
  on public.power_status for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (public.has_staff_role('manager'::public.staff_role));

drop trigger if exists power_status_set_updated_at on public.power_status;
create trigger power_status_set_updated_at
  before update on public.power_status
  for each row execute function public.set_updated_at();
