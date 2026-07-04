-- Must run after webmaster enum value exists (separate migration transaction).

create or replace function public.staff_role_rank(role public.staff_role)
returns int
language sql
immutable
as $$
  select case role
    when 'staff' then 1
    when 'manager' then 2
    when 'admin' then 3
    when 'webmaster' then 4
  end;
$$;
