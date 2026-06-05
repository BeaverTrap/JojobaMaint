-- Track last edit on feed posts (created_at stays the original post date).

alter table public.posts
  add column if not exists updated_at timestamptz not null default now();

update public.posts
  set updated_at = created_at
  where updated_at < created_at;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();
