-- Galleries are redundant: photos live on feed posts and inline in article markdown.

drop policy if exists "Gallery images are publicly viewable" on public.gallery_images;
drop policy if exists "Authorized users can insert gallery images" on public.gallery_images;
drop policy if exists "Authorized users can delete gallery images" on public.gallery_images;

drop policy if exists "Galleries are publicly viewable" on public.galleries;
drop policy if exists "Authorized users can insert galleries" on public.galleries;
drop policy if exists "Authorized users can update galleries" on public.galleries;
drop policy if exists "Authorized users can delete galleries" on public.galleries;

drop table if exists public.gallery_images;
drop table if exists public.galleries;
