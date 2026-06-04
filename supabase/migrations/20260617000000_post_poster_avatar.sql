-- Staff pick a crew icon per post; feed shows section + icon, not Google profile.

alter table public.posts
  add column if not exists poster_avatar text not null default 'crew-1';

comment on column public.posts.poster_avatar is
  'Slug from public/avatars (crew-1 … crew-5). Not the author profile photo.';
