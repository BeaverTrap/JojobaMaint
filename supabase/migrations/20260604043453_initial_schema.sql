-- =============================================================================
-- Jojoba Hills Maintenance — initial schema
-- Tables: profiles, posts, galleries, gallery_images
-- Plus: RLS policies, auto-profile trigger, and a public Storage bucket.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. profiles
--    One row per auth user. Holds display name + avatar shown across the app.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Any signed-in member can see everyone's basic profile (needed to show authors).
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- A user may insert their own profile row.
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- A user may update only their own profile.
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 2. posts — the main social feed
-- -----------------------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade,
  description text not null,
  image_url   text,
  created_at  timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_author_id_idx on public.posts (author_id);

alter table public.posts enable row level security;

create policy "Posts are viewable by authenticated users"
  on public.posts for select
  to authenticated
  using (true);

create policy "Users can create their own posts"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Users can update their own posts"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);

-- -----------------------------------------------------------------------------
-- 3. galleries — named photo albums (projects)
-- -----------------------------------------------------------------------------
create table if not exists public.galleries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists galleries_created_at_idx on public.galleries (created_at desc);

alter table public.galleries enable row level security;

create policy "Galleries are viewable by authenticated users"
  on public.galleries for select
  to authenticated
  using (true);

create policy "Users can create their own galleries"
  on public.galleries for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Users can update their own galleries"
  on public.galleries for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Users can delete their own galleries"
  on public.galleries for delete
  to authenticated
  using (auth.uid() = author_id);

-- -----------------------------------------------------------------------------
-- 4. gallery_images — many images per gallery
-- -----------------------------------------------------------------------------
create table if not exists public.gallery_images (
  id          uuid primary key default gen_random_uuid(),
  gallery_id  uuid not null references public.galleries (id) on delete cascade,
  image_url   text not null,
  created_at  timestamptz not null default now()
);

create index if not exists gallery_images_gallery_id_idx on public.gallery_images (gallery_id);

alter table public.gallery_images enable row level security;

create policy "Gallery images are viewable by authenticated users"
  on public.gallery_images for select
  to authenticated
  using (true);

-- Only the owner of the parent gallery can add images to it.
create policy "Users can add images to their own galleries"
  on public.gallery_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.galleries g
      where g.id = gallery_id and g.author_id = auth.uid()
    )
  );

create policy "Users can delete images from their own galleries"
  on public.gallery_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.galleries g
      where g.id = gallery_id and g.author_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 5. Auto-create a profile whenever a new auth user signs up.
--    Pulls display name + avatar from the Google OAuth metadata.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6. Keep profiles.updated_at fresh on update.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. Storage: a single public bucket for all compressed images.
--    Images are compressed client-side to < 300 KB before upload.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Public read so <Image> / <img> can load images by URL.
create policy "Public read access for images"
  on storage.objects for select
  using (bucket_id = 'images');

-- Authenticated users can upload into the bucket.
create policy "Authenticated users can upload images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images');

-- Authenticated users can update objects (needed for upsert).
create policy "Authenticated users can update images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images')
  with check (bucket_id = 'images');

-- Users can delete images they uploaded (owner is set automatically on upload).
create policy "Users can delete their own images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and owner = auth.uid());
