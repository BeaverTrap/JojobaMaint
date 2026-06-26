-- Staff role tiers: staff < manager < admin
-- Roles are set from authorized_emails.staff_role when a user is whitelisted.
-- Clients cannot change staff_role (not in the profiles UPDATE grant).

create type public.staff_role as enum ('staff', 'manager', 'admin');

alter table public.profiles
  add column if not exists staff_role public.staff_role;

alter table public.authorized_emails
  add column if not exists staff_role public.staff_role not null default 'staff';

comment on column public.authorized_emails.staff_role is
  'Role granted when this email is on the whitelist (staff, manager, or admin).';

comment on column public.profiles.staff_role is
  'Copied from authorized_emails on login; null when not whitelisted.';

-- Existing whitelisted users keep management access.
update public.profiles
   set staff_role = 'manager'
 where is_authorized = true
   and staff_role is null;

create or replace function public.staff_role_rank(role public.staff_role)
returns int
language sql
immutable
as $$
  select case role
    when 'staff' then 1
    when 'manager' then 2
    when 'admin' then 3
  end;
$$;

create or replace function public.has_staff_role(p_minimum public.staff_role)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (
      select public.staff_role_rank(p.staff_role) >= public.staff_role_rank(p_minimum)
        from public.profiles p
       where p.id = (select auth.uid())
         and p.is_authorized = true
    ),
    false
  );
$$;

revoke all on function public.has_staff_role(public.staff_role) from public;
grant execute on function public.has_staff_role(public.staff_role) to anon, authenticated;

create or replace function public.sync_my_authorization()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email        text;
  v_authorized   boolean;
  v_staff_role   public.staff_role;
begin
  select email into v_email from auth.users where id = (select auth.uid());
  if v_email is null then
    return false;
  end if;

  select exists (
    select 1 from public.authorized_emails ae
    where lower(ae.email) = lower(v_email)
  ) into v_authorized;

  if v_authorized then
    select ae.staff_role into v_staff_role
      from public.authorized_emails ae
     where lower(ae.email) = lower(v_email);
  end if;

  update public.profiles
     set is_authorized = coalesce(v_authorized, false),
         staff_role = case
           when coalesce(v_authorized, false) then coalesce(v_staff_role, 'staff'::public.staff_role)
           else null
         end,
         updated_at = now()
   where id = (select auth.uid());

  return coalesce(v_authorized, false);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_authorized boolean;
  v_staff_role public.staff_role;
begin
  select exists (
    select 1 from public.authorized_emails ae
    where lower(ae.email) = lower(new.email)
  ) into v_authorized;

  if v_authorized then
    select ae.staff_role into v_staff_role
      from public.authorized_emails ae
     where lower(ae.email) = lower(new.email);
  end if;

  insert into public.profiles (id, display_name, avatar_url, is_authorized, staff_role)
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
    coalesce(v_authorized, false),
    case
      when coalesce(v_authorized, false) then coalesce(v_staff_role, 'staff'::public.staff_role)
      else null
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Manager+ for site-wide content management
drop policy if exists "Authorized staff can update pickup guidelines" on public.pickup_guidelines;
create policy "Managers can update pickup guidelines"
  on public.pickup_guidelines for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (public.has_staff_role('manager'::public.staff_role));

drop policy if exists "Authorized users can insert articles" on public.articles;
create policy "Managers can insert articles"
  on public.articles for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and public.has_staff_role('manager'::public.staff_role)
  );

drop policy if exists "Authorized users can update articles" on public.articles;
create policy "Managers can update articles"
  on public.articles for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (public.has_staff_role('manager'::public.staff_role));

drop policy if exists "Authorized users can delete articles" on public.articles;
create policy "Managers can delete articles"
  on public.articles for delete
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role));
