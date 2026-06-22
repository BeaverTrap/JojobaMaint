-- Lots hidden from the park map (coords kept; staff can show again in /map/edit).
alter table public.park_map_positions
  add column if not exists hidden_lots jsonb not null default '[]';

comment on column public.park_map_positions.hidden_lots is
  'Lot IDs to omit from map display while keeping coordinates in lots jsonb.';
