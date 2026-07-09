-- Temporary mascots that webmasters can add/remove via the branding editor.
create table public.temp_mascots (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  src text not null,
  category text not null default 'mascot',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table public.temp_mascots enable row level security;

create policy "Anyone can read active temp mascots" on public.temp_mascots for select using (active = true);

create policy "Webmasters can manage temp mascots" on public.temp_mascots for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.staff_role = 'webmaster')
);
