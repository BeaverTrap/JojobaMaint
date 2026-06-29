-- Important notices / message board (separate from feed posts)

create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  severity    text not null default 'info'
    check (severity in ('info', 'notice', 'urgent')),
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  published   boolean not null default false,
  position    int not null default 0,
  author_id   uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists announcements_active_idx
  on public.announcements (published, starts_at desc, position);

alter table public.announcements enable row level security;

create policy "Active published announcements are publicly viewable"
  on public.announcements for select
  to anon, authenticated
  using (
    published = true
    and starts_at <= now()
    and (ends_at is null or ends_at > now())
  );

create policy "Managers can view all announcements"
  on public.announcements for select
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role));

create policy "Managers can insert announcements"
  on public.announcements for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and public.has_staff_role('manager'::public.staff_role)
  );

create policy "Managers can update announcements"
  on public.announcements for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (public.has_staff_role('manager'::public.staff_role));

create policy "Managers can delete announcements"
  on public.announcements for delete
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role));

create or replace function public.announcements_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.announcements_set_updated_at();
