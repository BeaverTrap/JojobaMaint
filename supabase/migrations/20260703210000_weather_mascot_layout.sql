-- Live weather mascot layout settings (editable via /weather/stack by webmasters).
create table public.weather_mascot_layout (
  id text primary key default 'default',
  map_left numeric not null default 0,
  map_top numeric not null default 0,
  map_width numeric not null default 100,
  map_height numeric not null default 89.65,
  quail_left numeric not null default 40.56,
  quail_top numeric not null default -0.9,
  quail_width numeric not null default 69.44,
  quail_height numeric not null default 100,
  temp_left numeric not null default 63.15,
  temp_top numeric not null default 9.62,
  temp_width numeric not null default 31.17,
  temp_height numeric not null default 18.19,
  stage_bottom_pad numeric,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.weather_mascot_layout enable row level security;

create policy "Anyone can read weather layout"
  on public.weather_mascot_layout for select using (true);

create policy "Webmasters can update weather layout"
  on public.weather_mascot_layout for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.staff_role = 'webmaster'
    )
  );

insert into public.weather_mascot_layout (id, map_left, map_top, map_width, map_height, quail_left, quail_top, quail_width, quail_height, temp_left, temp_top, temp_width, temp_height)
values ('default', 0, 0, 100, 89.6484375, 40.55710306406685, -0.904977375565611, 69.44289693593315, 100, 63.14565549465362, 9.6171875, 31.171084553868273, 18.187818156108595)
on conflict (id) do nothing;
