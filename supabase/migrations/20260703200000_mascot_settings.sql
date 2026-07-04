-- Stores per-scene avatar layout settings (overhang, scale, offset) editable by webmasters.
create table public.mascot_avatar_settings (
  scene_id text primary key,
  overhang_pct smallint not null default 20,
  scale_pct smallint not null default 100,
  offset_y smallint not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

comment on table public.mascot_avatar_settings is
  'Per-scene mascot avatar positioning — controls how the image sits in the navbar circle.';

-- Public read so all clients can fetch settings for rendering.
alter table public.mascot_avatar_settings enable row level security;

create policy "Anyone can read mascot settings"
  on public.mascot_avatar_settings for select
  using (true);

create policy "Webmasters can update mascot settings"
  on public.mascot_avatar_settings for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.staff_role = 'webmaster'
    )
  );

-- Seed defaults for current scenes.
insert into public.mascot_avatar_settings (scene_id, overhang_pct, scale_pct, offset_y)
values
  ('hardhat', 20, 100, 0),
  ('sunhat', 20, 100, 0)
on conflict (scene_id) do nothing;
