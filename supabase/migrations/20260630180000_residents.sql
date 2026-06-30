-- Residents for emergency SMS alerts (tagged groups + optional lot link).

create table public.residents (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone_number  text not null,
  tags          text[] not null default '{}',
  lot_id        text references public.lots (lot_number) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index residents_lot_id_idx on public.residents (lot_id);
create index residents_tags_gin_idx on public.residents using gin (tags);

comment on table public.residents is
  'Resident contact list for emergency SMS; tags group recipients (e.g. Board, Block A).';
comment on column public.residents.lot_id is
  'References lots.lot_number (park lot/site id from the valve spreadsheet).';

alter table public.residents enable row level security;

create policy "Residents are publicly viewable"
  on public.residents for select
  to anon, authenticated
  using (true);

create policy "Managers can insert residents"
  on public.residents for insert
  to authenticated
  with check (public.has_staff_role('manager'::public.staff_role));

create policy "Managers can update residents"
  on public.residents for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (public.has_staff_role('manager'::public.staff_role));

create policy "Managers can delete residents"
  on public.residents for delete
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role));

drop trigger if exists residents_set_updated_at on public.residents;
create trigger residents_set_updated_at
  before update on public.residents
  for each row execute function public.set_updated_at();
