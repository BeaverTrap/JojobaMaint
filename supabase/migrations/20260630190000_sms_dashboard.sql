-- Enterprise SMS dashboard: alert tiers, templates, scheduling, audit log.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'resident_alert_tier') then
    create type public.resident_alert_tier as enum (
      'critical_only',
      'standard',
      'high_communication'
    );
  end if;
end
$$;

alter table public.residents
  add column if not exists alert_tier public.resident_alert_tier not null default 'standard';

comment on column public.residents.alert_tier is
  'Resident SMS preference: critical_only = emergencies only; standard = emergencies + notices; high_communication = all including drips.';

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

do $$
begin
  if not exists (select 1 from pg_type where typname = 'scheduled_message_status') then
    create type public.scheduled_message_status as enum (
      'pending',
      'sent',
      'cancelled',
      'failed'
    );
  end if;
end
$$;

create table if not exists public.sms_templates (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  message_tier public.sms_message_tier not null default 'critical',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.scheduled_messages (
  id                      uuid primary key default gen_random_uuid(),
  created_by              uuid references public.profiles (id) on delete set null,
  body                    text not null,
  tags                    text[] not null default '{}',
  send_to_all             boolean not null default false,
  message_tier            public.sms_message_tier not null default 'critical',
  scheduled_at            timestamptz not null,
  sync_to_calendar        boolean not null default false,
  google_calendar_event_id text,
  status                  public.scheduled_message_status not null default 'pending',
  sent_at                 timestamptz,
  error_message           text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists scheduled_messages_pending_idx
  on public.scheduled_messages (scheduled_at)
  where status = 'pending';

create table if not exists public.sms_history (
  id                    uuid primary key default gen_random_uuid(),
  sent_by               uuid references public.profiles (id) on delete set null,
  body_template         text not null,
  tags                  text[] not null default '{}',
  send_to_all           boolean not null default false,
  message_tier          public.sms_message_tier not null default 'critical',
  recipient_count       int not null default 0,
  success_count         int not null default 0,
  failed_count          int not null default 0,
  voice_fallback_count  int not null default 0,
  scheduled_message_id  uuid references public.scheduled_messages (id) on delete set null,
  failures              jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists sms_history_created_at_idx
  on public.sms_history (created_at desc);

-- Starter templates (idempotent by title)
insert into public.sms_templates (title, body, message_tier, sort_order)
select v.title, v.body, v.message_tier::public.sms_message_tier, v.sort_order
from (
  values
    (
      'Water shutoff',
      'Jojoba Hills: Water shutoff in effect. {Name}, please conserve. Questions: office.',
      'critical',
      1
    ),
    (
      'Power outage',
      'Jojoba Hills ALERT: Power outage reported. {Name} (Lot {Lot}): check breakers; updates to follow.',
      'critical',
      2
    ),
    (
      'General notice',
      'Jojoba Hills: {Name}, please see the home page for a park update affecting Lot {Lot}.',
      'standard',
      3
    )
) as v(title, body, message_tier, sort_order)
where not exists (
  select 1 from public.sms_templates t where t.title = v.title
);

alter table public.sms_templates enable row level security;
alter table public.scheduled_messages enable row level security;
alter table public.sms_history enable row level security;

create policy "SMS templates are publicly viewable"
  on public.sms_templates for select
  to anon, authenticated
  using (true);

create policy "Managers can manage SMS templates"
  on public.sms_templates for all
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (public.has_staff_role('manager'::public.staff_role));

create policy "Managers can view scheduled messages"
  on public.scheduled_messages for select
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role));

create policy "Managers can insert scheduled messages"
  on public.scheduled_messages for insert
  to authenticated
  with check (public.has_staff_role('manager'::public.staff_role));

create policy "Managers can update scheduled messages"
  on public.scheduled_messages for update
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role))
  with check (public.has_staff_role('manager'::public.staff_role));

create policy "Managers can view SMS history"
  on public.sms_history for select
  to authenticated
  using (public.has_staff_role('manager'::public.staff_role));

drop trigger if exists sms_templates_set_updated_at on public.sms_templates;
create trigger sms_templates_set_updated_at
  before update on public.sms_templates
  for each row execute function public.set_updated_at();

drop trigger if exists scheduled_messages_set_updated_at on public.scheduled_messages;
create trigger scheduled_messages_set_updated_at
  before update on public.scheduled_messages
  for each row execute function public.set_updated_at();
