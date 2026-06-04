-- Multiple images per post + job-thread linking

create table if not exists public.post_images (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  image_url  text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists post_images_post_id_idx on public.post_images (post_id, position);

alter table public.post_images enable row level security;

create policy "Post images are publicly viewable"
  on public.post_images for select
  to anon, authenticated
  using (true);

create policy "Authorized users can insert post images"
  on public.post_images for insert
  to authenticated
  with check (public.is_authorized());

create policy "Authorized users can update post images"
  on public.post_images for update
  to authenticated
  using (public.is_authorized())
  with check (public.is_authorized());

create policy "Authorized users can delete post images"
  on public.post_images for delete
  to authenticated
  using (public.is_authorized());

-- Link a post to a previous post (continuing a job).
alter table public.posts
  add column if not exists parent_post_id uuid references public.posts (id) on delete set null;

create index if not exists posts_parent_post_id_idx on public.posts (parent_post_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'posts_no_self_parent'
  ) then
    alter table public.posts
      add constraint posts_no_self_parent
      check (parent_post_id is null or parent_post_id <> id);
  end if;
end $$;
