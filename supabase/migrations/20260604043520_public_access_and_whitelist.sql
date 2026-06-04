-- =============================================================================
-- Public portfolio + staff whitelist
--
-- Changes the access model from "members-only" to:
--   * SELECT  -> public (anon + authenticated) on profiles/posts/galleries/images
--   * WRITE   -> only authenticated users whose profile has is_authorized = true
--
-- Authorization is driven by a server-controlled whitelist (authorized_emails).
-- Users CANNOT grant themselves access: is_authorized is set only by trusted
-- SECURITY DEFINER code, never by the client.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Whitelist column + email allow-list table
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_authorized boolean not null default false;

-- The predefined list of allowed employee emails. Add rows here to authorize.
create table if not exists public.authorized_emails (
  email      text primary key,
  note       text,
  created_at timestamptz not null default now()
);

-- RLS on, with NO policies => unreachable by anon/authenticated via the API.
-- Only SECURITY DEFINER functions (which bypass RLS) can read it. This keeps
-- the staff list private and prevents clients from probing who is whitelisted.
alter table public.authorized_emails enable row level security;

-- Seed examples — replace with your real employee emails (or add them later):
-- insert into public.authorized_emails (email, note) values
--   ('jane.doe@example.com', 'Lead maintenance'),
--   ('john.smith@example.com', 'Grounds crew')
-- on conflict (email) do nothing;

-- -----------------------------------------------------------------------------
-- 2. Helper: is the CURRENT user an authorized staff member?
--    SECURITY DEFINER so it works regardless of profile read policies and is
--    safe to call from RLS policies on other tables. Takes no input, only ever
--    reports on auth.uid(), so it cannot be abused to read others' data.
-- -----------------------------------------------------------------------------
create or replace function public.is_authorized()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_authorized
       from public.profiles p
      where p.id = (select auth.uid())),
    false
  );
$$;

revoke all on function public.is_authorized() from public;
grant execute on function public.is_authorized() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Sync the caller's authorization from the whitelist.
--    Called on each login. SECURITY DEFINER so it can read authorized_emails
--    and write is_authorized (which the client itself is NOT allowed to write).
-- -----------------------------------------------------------------------------
create or replace function public.sync_my_authorization()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email      text;
  v_authorized boolean;
begin
  select email into v_email from auth.users where id = (select auth.uid());
  if v_email is null then
    return false;
  end if;

  select exists (
    select 1 from public.authorized_emails ae
    where lower(ae.email) = lower(v_email)
  ) into v_authorized;

  update public.profiles
     set is_authorized = coalesce(v_authorized, false),
         updated_at    = now()
   where id = (select auth.uid());

  return coalesce(v_authorized, false);
end;
$$;

revoke all on function public.sync_my_authorization() from public, anon;
grant execute on function public.sync_my_authorization() to authenticated;

-- -----------------------------------------------------------------------------
-- 4. New-user trigger now sets is_authorized from the whitelist at signup.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_authorized boolean;
begin
  select exists (
    select 1 from public.authorized_emails ae
    where lower(ae.email) = lower(new.email)
  ) into v_authorized;

  insert into public.profiles (id, display_name, avatar_url, is_authorized)
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
    ),
    coalesce(v_authorized, false)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Lock down profiles writes:
--    * Reads are public (needed to show author names/avatars to anon visitors).
--    * Users may edit ONLY their display_name / avatar_url, never is_authorized.
-- -----------------------------------------------------------------------------
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are publicly viewable"
  on public.profiles for select
  to anon, authenticated
  using (true);

-- Column-level privileges: prevent clients from ever writing is_authorized.
-- (The SECURITY DEFINER functions above run as the owner and bypass this.)
revoke update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url, updated_at) on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- 6. posts — public read, authorized-only write
-- -----------------------------------------------------------------------------
drop policy if exists "Posts are viewable by authenticated users" on public.posts;
drop policy if exists "Users can create their own posts" on public.posts;
drop policy if exists "Users can update their own posts" on public.posts;
drop policy if exists "Users can delete their own posts" on public.posts;

create policy "Posts are publicly viewable"
  on public.posts for select
  to anon, authenticated
  using (true);

create policy "Authorized users can insert posts"
  on public.posts for insert
  to authenticated
  with check (author_id = (select auth.uid()) and public.is_authorized());

create policy "Authorized users can update posts"
  on public.posts for update
  to authenticated
  using (public.is_authorized())
  with check (public.is_authorized());

create policy "Authorized users can delete posts"
  on public.posts for delete
  to authenticated
  using (public.is_authorized());

-- -----------------------------------------------------------------------------
-- 7. galleries — public read, authorized-only write
-- -----------------------------------------------------------------------------
drop policy if exists "Galleries are viewable by authenticated users" on public.galleries;
drop policy if exists "Users can create their own galleries" on public.galleries;
drop policy if exists "Users can update their own galleries" on public.galleries;
drop policy if exists "Users can delete their own galleries" on public.galleries;

create policy "Galleries are publicly viewable"
  on public.galleries for select
  to anon, authenticated
  using (true);

create policy "Authorized users can insert galleries"
  on public.galleries for insert
  to authenticated
  with check (author_id = (select auth.uid()) and public.is_authorized());

create policy "Authorized users can update galleries"
  on public.galleries for update
  to authenticated
  using (public.is_authorized())
  with check (public.is_authorized());

create policy "Authorized users can delete galleries"
  on public.galleries for delete
  to authenticated
  using (public.is_authorized());

-- -----------------------------------------------------------------------------
-- 8. gallery_images — public read, authorized-only write
-- -----------------------------------------------------------------------------
drop policy if exists "Gallery images are viewable by authenticated users" on public.gallery_images;
drop policy if exists "Users can add images to their own galleries" on public.gallery_images;
drop policy if exists "Users can delete images from their own galleries" on public.gallery_images;

create policy "Gallery images are publicly viewable"
  on public.gallery_images for select
  to anon, authenticated
  using (true);

create policy "Authorized users can insert gallery images"
  on public.gallery_images for insert
  to authenticated
  with check (public.is_authorized());

create policy "Authorized users can delete gallery images"
  on public.gallery_images for delete
  to authenticated
  using (public.is_authorized());

-- -----------------------------------------------------------------------------
-- 9. Storage: public read, authorized-only write/delete on the `images` bucket
-- -----------------------------------------------------------------------------
drop policy if exists "Public read access for images" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Authenticated users can update images" on storage.objects;
drop policy if exists "Users can delete their own images" on storage.objects;

create policy "Public read access for images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'images');

create policy "Authorized users can upload images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images' and public.is_authorized());

create policy "Authorized users can update images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and public.is_authorized())
  with check (bucket_id = 'images' and public.is_authorized());

create policy "Authorized users can delete images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and public.is_authorized());
