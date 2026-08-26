-- Plexus-owned TChina Expo 2026 configuration and review-gated registrations.
create table public.tchina_events (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null unique default 'plexus'
    check (singleton_key = 'plexus'),
  title text not null default 'TChina Expo 2026'
    check (char_length(btrim(title)) between 2 and 160),
  city text not null default 'Guangzhou'
    check (char_length(btrim(city)) between 2 and 120),
  venue_name text not null default ''
    check (char_length(venue_name) <= 240),
  venue_address text not null default ''
    check (char_length(venue_address) <= 500),
  organizer_name text not null default ''
    check (char_length(organizer_name) <= 240),
  support_email text not null default ''
    check (char_length(support_email) <= 320),
  starts_on date not null default date '2026-08-31',
  ends_on date not null default date '2026-09-04',
  timezone text not null default 'Asia/Shanghai'
    check (timezone = 'Asia/Shanghai'),
  registration_open boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tchina_event_dates_check check (
    starts_on = date '2026-08-31'
    and ends_on = date '2026-09-04'
  ),
  constraint tchina_event_publish_check check (
    not registration_open
    or (
      char_length(btrim(venue_name)) >= 2
      and char_length(btrim(venue_address)) >= 4
      and char_length(btrim(organizer_name)) >= 2
      and support_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
      and published_at is not null
    )
  )
);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null
    references public.tchina_events(id) on delete restrict,
  reference_code text not null unique
    check (reference_code ~ '^TC26-[0-9]{8}-[A-Z0-9]{6}$'),
  attendee_type text not null
    check (attendee_type in ('business_delegate', 'general_visitor')),
  normalized_email text not null
    check (
      normalized_email = lower(btrim(normalized_email))
      and char_length(normalized_email) between 3 and 320
    ),
  full_name text not null
    check (char_length(btrim(full_name)) between 2 and 160),
  mobile_number text not null
    check (mobile_number ~ '^\+[1-9][0-9]{6,30}$'),
  chat_platform text not null default 'none'
    check (chat_platform in ('none', 'whatsapp', 'wechat')),
  chat_id text not null default ''
    check (char_length(chat_id) <= 120),
  country_region text not null
    check (char_length(btrim(country_region)) between 2 and 120),
  preferred_language text not null
    check (preferred_language in ('en', 'zh')),
  attendance_dates date[] not null
    check (
      cardinality(attendance_dates) between 1 and 5
      and attendance_dates <@ array[
        date '2026-08-31',
        date '2026-09-01',
        date '2026-09-02',
        date '2026-09-03',
        date '2026-09-04'
      ]
    ),
  answers jsonb not null
    check (jsonb_typeof(answers) = 'object'),
  status text not null default 'pending'
    check (status in ('pending', 'provisioning', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  vendor_company_id uuid
    references public.vendor_companies(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  receipt_email_sent_at timestamptz,
  invitation_email_sent_at timestamptz,
  setup_email_sent_at timestamptz,
  consented_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_registration_review_state_check check (
    (
      status in ('pending', 'provisioning')
      and vendor_company_id is null
      and auth_user_id is null
    )
    or (
      status = 'rejected'
      and reviewed_by is not null
      and reviewed_at is not null
      and vendor_company_id is null
      and auth_user_id is null
    )
    or (
      status = 'approved'
      and reviewed_by is not null
      and reviewed_at is not null
      and (
        (attendee_type = 'general_visitor'
          and vendor_company_id is null
          and auth_user_id is null)
        or
        (attendee_type = 'business_delegate'
          and vendor_company_id is not null
          and auth_user_id is not null)
      )
    )
  ),
  constraint event_registration_invitation_state_check check (
    invitation_email_sent_at is null or status = 'approved'
  ),
  constraint event_registration_setup_state_check check (
    setup_email_sent_at is null
    or (status = 'approved' and attendee_type = 'business_delegate')
  )
);

create unique index event_registrations_non_rejected_email_idx
  on public.event_registrations(event_id, normalized_email)
  where status <> 'rejected';

create index event_registrations_status_created_idx
  on public.event_registrations(status, created_at desc);
create index event_registrations_event_reference_idx
  on public.event_registrations(event_id, reference_code);
create index event_registrations_reviewed_by_idx
  on public.event_registrations(reviewed_by)
  where reviewed_by is not null;

create or replace function private.protect_tchina_event_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and (
      old.id is distinct from new.id
      or old.singleton_key is distinct from new.singleton_key
      or old.created_at is distinct from new.created_at
    )
  then
    raise exception 'TChina event identity is immutable';
  end if;

  if tg_op = 'INSERT' then
    if new.registration_open then
      new.published_at := now();
    end if;
  elsif new.registration_open and not old.registration_open then
    new.published_at := now();
  end if;

  return new;
end
$$;

revoke all on function private.protect_tchina_event_write()
  from public, anon, authenticated;

create trigger protect_tchina_event_write
  before insert or update on public.tchina_events
  for each row execute function private.protect_tchina_event_write();

create trigger touch_tchina_events_updated_at
  before update on public.tchina_events
  for each row execute function public.touch_updated_at();

create or replace function private.protect_event_registration_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.tchina_events event
    where event.id = new.event_id
      and event.singleton_key = 'plexus'
  ) then
    raise exception 'Registration must belong to the Plexus TChina event';
  end if;

  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id
      or old.event_id is distinct from new.event_id
      or old.reference_code is distinct from new.reference_code
      or old.attendee_type is distinct from new.attendee_type
      or old.normalized_email is distinct from new.normalized_email
      or old.full_name is distinct from new.full_name
      or old.mobile_number is distinct from new.mobile_number
      or old.chat_platform is distinct from new.chat_platform
      or old.chat_id is distinct from new.chat_id
      or old.country_region is distinct from new.country_region
      or old.preferred_language is distinct from new.preferred_language
      or old.attendance_dates is distinct from new.attendance_dates
      or old.answers is distinct from new.answers
      or old.consented_at is distinct from new.consented_at
      or old.created_at is distinct from new.created_at
    then
      raise exception 'Submitted event registration identity and answers are immutable';
    end if;

    if not (
      (old.status = 'pending' and new.status in ('provisioning', 'approved', 'rejected'))
      or (old.status = 'provisioning' and new.status in ('pending', 'approved'))
      or (old.status = new.status)
    ) then
      raise exception 'Invalid event registration status transition';
    end if;

    if new.status = 'approved'
      and new.attendee_type = 'business_delegate'
      and (
        coalesce((select auth.jwt()->>'role'), '') <> 'service_role'
        and current_user not in ('postgres', 'supabase_admin')
      )
    then
      raise exception 'Business Delegate finalization requires a trusted server workflow'
        using errcode = '42501';
    end if;
  end if;

  return new;
end
$$;

revoke all on function private.protect_event_registration_write()
  from public, anon, authenticated;

create trigger protect_event_registration_write
  before insert or update on public.event_registrations
  for each row execute function private.protect_event_registration_write();

create trigger touch_event_registrations_updated_at
  before update on public.event_registrations
  for each row execute function public.touch_updated_at();

alter table public.tchina_events enable row level security;
alter table public.event_registrations enable row level security;

create policy "Plexus TChina event Superadmin read"
  on public.tchina_events for select to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  );

create policy "Plexus TChina registration Superadmin read"
  on public.event_registrations for select to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  );

revoke all on public.tchina_events from public, anon, authenticated, service_role;
revoke all on public.event_registrations from public, anon, authenticated, service_role;
grant select on public.tchina_events, public.event_registrations to authenticated;
grant select, insert, update, delete on public.tchina_events to service_role;
grant select, insert, update, delete on public.event_registrations to service_role;

insert into public.tchina_events (singleton_key, title, city)
values ('plexus', 'TChina Expo 2026', 'Guangzhou')
on conflict (singleton_key) do nothing;
