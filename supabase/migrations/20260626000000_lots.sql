-- Park lot profiles: zone/valve data from Google Sheets + staff notes.

create table if not exists public.lots (
  lot_number            text primary key,
  slug                  text not null unique,
  zones                 text[] not null default '{}',
  valves                text[] not null default '{}',
  unit_id               text,
  has_cross_connection  boolean,
  sheet_notes           text,
  staff_notes           text,
  map_x                 numeric,
  map_y                 numeric,
  sheet_synced_at       timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists lots_slug_idx on public.lots (slug);

comment on table public.lots is
  'Lot/site profiles synced from the valve spreadsheet; staff_notes editable in admin.';

drop trigger if exists lots_set_updated_at on public.lots;
create trigger lots_set_updated_at
  before update on public.lots
  for each row execute function public.set_updated_at();

alter table public.lots enable row level security;

create policy "Lots are publicly viewable"
  on public.lots for select
  to anon, authenticated
  using (true);

create policy "Authorized staff can update lot staff notes"
  on public.lots for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_authorized = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_authorized = true
    )
  );

create table if not exists public.lots_sync_state (
  id              text primary key default 'default',
  last_synced_at  timestamptz,
  updated_at      timestamptz not null default now()
);

alter table public.lots_sync_state enable row level security;

insert into public.lots_sync_state (id)
values ('default')
on conflict (id) do nothing;
