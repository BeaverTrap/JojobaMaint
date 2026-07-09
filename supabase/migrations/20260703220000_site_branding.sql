-- Live site branding/theme settings editable by webmasters.
create table public.site_branding (
  id text primary key default 'default',
  brand_50 text not null default '#f1f7f2',
  brand_100 text not null default '#dcede0',
  brand_200 text not null default '#bbdcc3',
  brand_300 text not null default '#8fc29e',
  brand_400 text not null default '#5da176',
  brand_500 text not null default '#3d8459',
  brand_600 text not null default '#2d6a47',
  brand_700 text not null default '#25553a',
  brand_800 text not null default '#204430',
  brand_900 text not null default '#1b3829',
  brand_950 text not null default '#0f1f17',
  gold text not null default '#c0882c',
  wordmark_primary text not null default 'ink',
  wordmark_accent text not null default 'brand-600',
  avatar_ring text not null default 'brand-500',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.site_branding enable row level security;

create policy "Anyone can read site branding" on public.site_branding for select using (true);

create policy "Webmasters can update site branding" on public.site_branding for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.staff_role = 'webmaster')
);

insert into public.site_branding (id) values ('default') on conflict (id) do nothing;
