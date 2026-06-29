-- Park alert types drive status art and can override water / power / laundry cards.

alter table public.announcements
  add column if not exists alert_type text not null default 'general'
  check (
    alert_type in (
      'general',
      'water_shutoff',
      'water_planned',
      'water_gravity',
      'power_outage',
      'power_planned',
      'laundry'
    )
  );

create index if not exists announcements_alert_type_idx
  on public.announcements (alert_type)
  where published = true;
