create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_tenants(id) on delete set null,
  sender_type text not null
    check (
      sender_type in (
        'supabase_auth',
        'plexus_system',
        'superadmin',
        'admin',
        'vendor'
      )
    ),
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_name text not null default 'Plexus',
  from_address text not null default '',
  recipient_email text not null,
  recipient_name text not null default '',
  recipient_role text not null default 'unknown'
    check (
      recipient_role in (
        'superadmin',
        'admin',
        'vendor',
        'external',
        'unknown'
      )
    ),
  trigger_key text not null,
  subject text not null,
  provider text not null check (provider in ('resend', 'supabase_auth')),
  provider_message_id text,
  status text not null default 'queued'
    check (
      status in (
        'requested',
        'queued',
        'scheduled',
        'sent',
        'delivered',
        'delivery_delayed',
        'bounced',
        'complained',
        'suppressed',
        'failed',
        'canceled'
      )
    ),
  status_detail text not null default '',
  source_table text,
  source_id text,
  idempotency_key text not null unique,
  requested_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  failed_at timestamptz,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.email_deliveries is
  'Superadmin-only delivery ledger. One row represents one intended recipient. Supabase Auth requests remain requested until a provider event can be correlated.';
comment on column public.email_deliveries.status_detail is
  'Sanitized operational detail only. Provider credentials, reset links, message bodies, and raw responses must never be stored.';

create table if not exists public.email_delivery_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null
    references public.email_deliveries(id) on delete cascade,
  provider_event_id text not null unique,
  event_type text not null,
  occurred_at timestamptz not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.email_delivery_events is
  'Idempotent, sanitized Resend lifecycle events used to update the Superadmin delivery ledger.';

create or replace trigger touch_email_deliveries_updated_at
  before update on public.email_deliveries
  for each row execute function public.touch_updated_at();

create index if not exists email_deliveries_created_at_idx
  on public.email_deliveries(created_at desc);
create index if not exists email_deliveries_admin_created_at_idx
  on public.email_deliveries(admin_id, created_at desc);
create index if not exists email_deliveries_sender_created_at_idx
  on public.email_deliveries(sender_type, sender_user_id, created_at desc);
create index if not exists email_deliveries_status_created_at_idx
  on public.email_deliveries(status, created_at desc);
create index if not exists email_deliveries_trigger_created_at_idx
  on public.email_deliveries(trigger_key, created_at desc);
create unique index if not exists email_deliveries_provider_message_id_key
  on public.email_deliveries(provider_message_id)
  where provider_message_id is not null;
create index if not exists email_delivery_events_delivery_created_at_idx
  on public.email_delivery_events(delivery_id, created_at desc);

alter table public.email_deliveries enable row level security;
alter table public.email_delivery_events enable row level security;

drop policy if exists "superadmin reads email deliveries"
  on public.email_deliveries;
drop policy if exists "superadmin reads email delivery events"
  on public.email_delivery_events;

create policy "superadmin reads email deliveries"
  on public.email_deliveries for select to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  );

create policy "superadmin reads email delivery events"
  on public.email_delivery_events for select to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
    and exists (
      select 1
      from public.email_deliveries delivery
      where delivery.id = email_delivery_events.delivery_id
    )
  );

revoke all on public.email_deliveries from anon;
revoke all on public.email_delivery_events from anon;
revoke all on public.email_deliveries from authenticated;
revoke all on public.email_delivery_events from authenticated;
revoke all on public.email_deliveries from service_role;
revoke all on public.email_delivery_events from service_role;

grant select on public.email_deliveries to authenticated;
grant select on public.email_delivery_events to authenticated;
grant select, insert, update, delete on public.email_deliveries to service_role;
grant select, insert, update, delete
  on public.email_delivery_events to service_role;
