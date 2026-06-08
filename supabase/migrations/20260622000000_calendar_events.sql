-- Maintenance schedule: cache Google Calendar events for the public /schedule page.

create table if not exists public.calendar_events (
  id              uuid primary key default gen_random_uuid(),
  google_event_id text not null unique,
  title           text not null,
  description     text,
  start_time      timestamptz not null,
  end_time        timestamptz not null,
  all_day         boolean not null default false,
  status          text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled', 'tentative')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists calendar_events_start_time_idx
  on public.calendar_events (start_time);

create index if not exists calendar_events_end_time_idx
  on public.calendar_events (end_time);

comment on table public.calendar_events is
  'Cached maintenance schedule events synced from Google Calendar.';

drop trigger if exists calendar_events_set_updated_at on public.calendar_events;
create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

alter table public.calendar_events enable row level security;

create policy "Calendar events are publicly viewable"
  on public.calendar_events for select
  to anon, authenticated
  using (status <> 'cancelled');

-- Webhook sync metadata (service role only; no public policies).
create table if not exists public.calendar_sync_state (
  id                 text primary key default 'default',
  watch_channel_id   text,
  watch_resource_id  text,
  watch_expiration   timestamptz,
  sync_token         text,
  last_synced_at     timestamptz,
  updated_at         timestamptz not null default now()
);

alter table public.calendar_sync_state enable row level security;

insert into public.calendar_sync_state (id)
values ('default')
on conflict (id) do nothing;
