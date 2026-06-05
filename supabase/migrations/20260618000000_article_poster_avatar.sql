-- Same crew icons as feed posts.

alter table public.articles
  add column if not exists poster_avatar text not null default 'crew-1';

comment on column public.articles.poster_avatar is
  'Slug from public/avatars (crew-1 … crew-10). Not the author profile photo.';
