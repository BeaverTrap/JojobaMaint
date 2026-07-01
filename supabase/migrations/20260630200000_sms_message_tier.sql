-- Replace is_critical boolean with sms_message_tier enum (if prior migration ran).

do $$
begin
  if not exists (select 1 from pg_type where typname = 'sms_message_tier') then
    create type public.sms_message_tier as enum (
      'critical',
      'standard',
      'announcement'
    );
  end if;
end
$$;

comment on type public.sms_message_tier is
  'Message priority: critical = everyone; standard = skips critical_only residents; announcement = high_communication only.';

-- sms_templates
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sms_templates'
      and column_name = 'is_critical'
  ) then
    alter table public.sms_templates
      add column if not exists message_tier public.sms_message_tier;

    update public.sms_templates
    set message_tier = case when is_critical then 'critical'::public.sms_message_tier else 'standard'::public.sms_message_tier end
    where message_tier is null;

    alter table public.sms_templates
      alter column message_tier set not null,
      alter column message_tier set default 'critical';

    alter table public.sms_templates drop column is_critical;
  end if;
end
$$;

-- scheduled_messages
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'scheduled_messages'
      and column_name = 'is_critical'
  ) then
    alter table public.scheduled_messages
      add column if not exists message_tier public.sms_message_tier;

    update public.scheduled_messages
    set message_tier = case when is_critical then 'critical'::public.sms_message_tier else 'standard'::public.sms_message_tier end
    where message_tier is null;

    alter table public.scheduled_messages
      alter column message_tier set not null,
      alter column message_tier set default 'critical';

    alter table public.scheduled_messages drop column is_critical;
  end if;
end
$$;

-- sms_history
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sms_history'
      and column_name = 'is_critical'
  ) then
    alter table public.sms_history
      add column if not exists message_tier public.sms_message_tier;

    update public.sms_history
    set message_tier = case when is_critical then 'critical'::public.sms_message_tier else 'standard'::public.sms_message_tier end
    where message_tier is null;

    alter table public.sms_history
      alter column message_tier set not null,
      alter column message_tier set default 'critical';

    alter table public.sms_history drop column is_critical;
  end if;
end
$$;
