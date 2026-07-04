-- Webmaster tier: above admin. Builder/dev tools (e.g. weather mascot layout).

alter type public.staff_role add value if not exists 'webmaster';

comment on column public.authorized_emails.staff_role is
  'Role granted when whitelisted: staff, manager, admin, or webmaster.';

comment on column public.profiles.staff_role is
  'Copied from authorized_emails on login; null when not whitelisted.';
