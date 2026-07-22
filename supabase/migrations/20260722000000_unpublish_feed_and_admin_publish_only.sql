-- Unpublish every feed item and restrict publishing to admins.

-- -----------------------------------------------------------------------------
-- 1. posts: add a published flag (all existing posts become drafts).
-- -----------------------------------------------------------------------------
alter table public.posts
  add column if not exists published boolean not null default false;

create index if not exists posts_published_idx
  on public.posts (published, created_at desc);

update public.posts set published = false;
update public.articles set published = false;
update public.tree_assessments set published = false;
update public.maintenance_assessments set published = false;

-- -----------------------------------------------------------------------------
-- 2. posts — public read only published, authorized can read all,
--    managers/staff can draft, only admins can set published = true.
-- -----------------------------------------------------------------------------
drop policy if exists "Posts are publicly viewable" on public.posts;
drop policy if exists "Authorized users can insert posts" on public.posts;
drop policy if exists "Authorized users can update posts" on public.posts;
drop policy if exists "Authorized users can delete posts" on public.posts;

create policy "Posts are publicly viewable"
  on public.posts for select
  to anon, authenticated
  using (published = true);

create policy "Authorized users can view all posts"
  on public.posts for select
  to authenticated
  using (public.is_authorized());

create policy "Authorized users can insert posts"
  on public.posts for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_authorized()
    and (
      public.has_staff_role('admin'::public.staff_role)
      or published = false
    )
  );

create policy "Authorized users can update posts"
  on public.posts for update
  to authenticated
  using (public.is_authorized())
  with check (
    public.is_authorized()
    and (
      public.has_staff_role('admin'::public.staff_role)
      or published = false
    )
  );

create policy "Authorized users can delete posts"
  on public.posts for delete
  to authenticated
  using (public.is_authorized());

-- -----------------------------------------------------------------------------
-- 3. articles — same publishing restriction (admin-only publish).
-- -----------------------------------------------------------------------------
drop policy if exists "Published articles are publicly viewable" on public.articles;
drop policy if exists "Authorized users can view all articles" on public.articles;
drop policy if exists "Managers can insert articles" on public.articles;
drop policy if exists "Managers can update articles" on public.articles;
drop policy if exists "Managers can delete articles" on public.articles;

create policy "Published articles are publicly viewable"
  on public.articles for select
  to anon, authenticated
  using (published = true);

create policy "Authorized users can view all articles"
  on public.articles for select
  to authenticated
  using (public.is_authorized());

create policy "Managers can insert articles"
  on public.articles for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and public.has_staff_role('manager'::public.staff_role)
    and (
      public.has_staff_role('admin'::public.staff_role)
      or published = false
    )
  );

create policy "Managers can update articles"
  on public.articles for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (
    public.has_staff_role('manager'::public.staff_role)
    and (
      public.has_staff_role('admin'::public.staff_role)
      or published = false
    )
  );

create policy "Managers can delete articles"
  on public.articles for delete
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role));

-- -----------------------------------------------------------------------------
-- 4. tree_assessments — admin-only publish.
-- -----------------------------------------------------------------------------
drop policy if exists "Published tree assessments are publicly viewable" on public.tree_assessments;
drop policy if exists "Authorized users can view all tree assessments" on public.tree_assessments;
drop policy if exists "Authorized users can insert tree assessments" on public.tree_assessments;
drop policy if exists "Authorized users can update tree assessments" on public.tree_assessments;
drop policy if exists "Authorized users can delete tree assessments" on public.tree_assessments;

create policy "Published tree assessments are publicly viewable"
  on public.tree_assessments for select
  to anon, authenticated
  using (published = true);

create policy "Managers can view all tree assessments"
  on public.tree_assessments for select
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role));

create policy "Managers can insert tree assessments"
  on public.tree_assessments for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and public.has_staff_role('manager'::public.staff_role)
    and (
      public.has_staff_role('admin'::public.staff_role)
      or published = false
    )
  );

create policy "Managers can update tree assessments"
  on public.tree_assessments for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (
    public.has_staff_role('manager'::public.staff_role)
    and (
      public.has_staff_role('admin'::public.staff_role)
      or published = false
    )
  );

create policy "Managers can delete tree assessments"
  on public.tree_assessments for delete
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role));

-- -----------------------------------------------------------------------------
-- 5. maintenance_assessments — admin-only publish.
-- -----------------------------------------------------------------------------
drop policy if exists "Published maintenance assessments are publicly viewable" on public.maintenance_assessments;
drop policy if exists "Authorized users can view all maintenance assessments" on public.maintenance_assessments;
drop policy if exists "Authorized users can insert maintenance assessments" on public.maintenance_assessments;
drop policy if exists "Authorized users can update maintenance assessments" on public.maintenance_assessments;
drop policy if exists "Authorized users can delete maintenance assessments" on public.maintenance_assessments;

create policy "Published maintenance assessments are publicly viewable"
  on public.maintenance_assessments for select
  to anon, authenticated
  using (published = true);

create policy "Managers can view all maintenance assessments"
  on public.maintenance_assessments for select
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role));

create policy "Managers can insert maintenance assessments"
  on public.maintenance_assessments for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and public.has_staff_role('manager'::public.staff_role)
    and (
      public.has_staff_role('admin'::public.staff_role)
      or published = false
    )
  );

create policy "Managers can update maintenance assessments"
  on public.maintenance_assessments for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (
    public.has_staff_role('manager'::public.staff_role)
    and (
      public.has_staff_role('admin'::public.staff_role)
      or published = false
    )
  );

create policy "Managers can delete maintenance assessments"
  on public.maintenance_assessments for delete
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role));
