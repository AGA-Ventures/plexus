create table if not exists public.meeting_creation_jobs (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null,
  admin_id uuid not null,
  provider text not null
    check (provider in ('zoom', 'lark')),
  status text not null default 'processing'
    check (status in ('processing', 'succeeded', 'failed')),
  attempt_count integer not null default 1
    check (attempt_count between 1 and 20),
  failure_code text
    check (
      failure_code is null
      or failure_code in (
        'configuration',
        'authorization',
        'rate_limited',
        'timeout',
        'provider_error',
        'storage_error',
        'agreement_changed',
        'incident_store_error'
      )
    ),
  failure_summary text
    check (
      failure_summary is null
      or char_length(failure_summary) <= 240
    ),
  last_attempt_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meeting_creation_jobs_match_id_key unique (match_id),
  constraint meeting_creation_jobs_match_tenant_fkey
    foreign key (match_id, admin_id)
    references public.matches(id, admin_id)
    on delete cascade,
  constraint meeting_creation_jobs_failure_state_check
    check (
      (status = 'failed' and failure_code is not null and failure_summary is not null)
      or
      (status <> 'failed' and failure_code is null and failure_summary is null)
    ),
  constraint meeting_creation_jobs_resolution_check
    check (
      (status = 'succeeded' and resolved_at is not null)
      or
      (status <> 'succeeded' and resolved_at is null)
    )
);

create index if not exists meeting_creation_jobs_status_updated_at_idx
  on public.meeting_creation_jobs(status, updated_at desc);

create index if not exists meeting_creation_jobs_admin_id_updated_at_idx
  on public.meeting_creation_jobs(admin_id, updated_at desc);

create or replace trigger touch_meeting_creation_jobs_updated_at
  before update on public.meeting_creation_jobs
  for each row execute function public.touch_updated_at();

alter table public.meeting_creation_jobs enable row level security;

drop policy if exists "superadmin selects meeting creation jobs"
  on public.meeting_creation_jobs;

create policy "superadmin selects meeting creation jobs"
  on public.meeting_creation_jobs
  for select
  to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  );

revoke all on table public.meeting_creation_jobs from anon;
revoke all on table public.meeting_creation_jobs from authenticated;
revoke all on table public.meeting_creation_jobs from service_role;

grant select on table public.meeting_creation_jobs to authenticated;
grant select, insert, update, delete
  on table public.meeting_creation_jobs
  to service_role;

comment on table public.meeting_creation_jobs is
  'Service-controlled automatic meeting creation state. Superadmins may read sanitized failures; provider payloads and credentials are never stored here.';
