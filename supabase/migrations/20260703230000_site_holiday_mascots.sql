-- Holiday mascots with date ranges for navbar rotation and calendar display.
create table public.site_holiday_mascots (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  src text not null,
  start_month smallint not null,
  start_day smallint not null,
  end_month smallint not null,
  end_day smallint not null,
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table public.site_holiday_mascots enable row level security;

create policy "Anyone can read active holiday mascots" on public.site_holiday_mascots for select using (active = true);

create policy "Webmasters can manage holiday mascots" on public.site_holiday_mascots for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.staff_role = 'webmaster')
);
