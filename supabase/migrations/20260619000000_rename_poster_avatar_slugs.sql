-- Rename crew-N slugs to maintenance-* / landscaping-*.

update public.posts
set poster_avatar = case poster_avatar
  when 'crew-1' then 'maintenance-sky'
  when 'crew-2' then 'landscaping-sky'
  when 'crew-3' then 'maintenance-red'
  when 'crew-4' then 'landscaping-red'
  when 'crew-5' then 'maintenance-navy'
  when 'crew-6' then 'landscaping-navy'
  when 'crew-7' then 'maintenance-green'
  when 'crew-8' then 'landscaping-green'
  when 'crew-9' then 'maintenance-olive'
  when 'crew-10' then 'landscaping-olive'
  else poster_avatar
end
where poster_avatar like 'crew-%';

update public.articles
set poster_avatar = case poster_avatar
  when 'crew-1' then 'maintenance-sky'
  when 'crew-2' then 'landscaping-sky'
  when 'crew-3' then 'maintenance-red'
  when 'crew-4' then 'landscaping-red'
  when 'crew-5' then 'maintenance-navy'
  when 'crew-6' then 'landscaping-navy'
  when 'crew-7' then 'maintenance-green'
  when 'crew-8' then 'landscaping-green'
  when 'crew-9' then 'maintenance-olive'
  when 'crew-10' then 'landscaping-olive'
  else poster_avatar
end
where poster_avatar like 'crew-%';

alter table public.posts
  alter column poster_avatar set default 'maintenance-sky';

alter table public.articles
  alter column poster_avatar set default 'maintenance-sky';
