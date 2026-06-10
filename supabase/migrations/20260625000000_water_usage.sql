-- Park water usage readings synced from Google Sheets.

create table if not exists public.water_usage_readings (
  id             uuid primary key default gen_random_uuid(),
  period_month   date not null,
  gallons        numeric,
  cost_usd       numeric,
  notes          text,
  sheet_row_key  text not null unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint water_usage_readings_period_month_unique unique (period_month)
);

create index if not exists water_usage_readings_period_month_idx
  on public.water_usage_readings (period_month desc);

comment on table public.water_usage_readings is
  'Monthly water usage cached from a shared Google Sheet.';

drop trigger if exists water_usage_readings_set_updated_at on public.water_usage_readings;
create trigger water_usage_readings_set_updated_at
  before update on public.water_usage_readings
  for each row execute function public.set_updated_at();

alter table public.water_usage_readings enable row level security;

create policy "Water usage readings are publicly viewable"
  on public.water_usage_readings for select
  to anon, authenticated
  using (true);

create table if not exists public.water_usage_sync_state (
  id              text primary key default 'default',
  last_synced_at  timestamptz,
  updated_at      timestamptz not null default now()
);

alter table public.water_usage_sync_state enable row level security;

insert into public.water_usage_sync_state (id)
values ('default')
on conflict (id) do nothing;
