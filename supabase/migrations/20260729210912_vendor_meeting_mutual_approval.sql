-- Vendor-selected times are proposals until both companies approve the same
-- slot. Only the second approval creates the canonical meeting row.

create table public.meeting_proposals (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null default public.current_admin_id()
    references public.admin_tenants(id) on delete restrict,
  match_id uuid not null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60
    check (duration_minutes = 60),
  requested_interpreter_id uuid
    references public.interpreters(id) on delete set null,
  requested_by_vendor_type text
    check (
      requested_by_vendor_type is null
      or requested_by_vendor_type in ('delegation', 'partner')
    ),
  requested_by_vendor_company_id uuid
    references public.vendor_companies(id) on delete set null,
  delegation_approved_at timestamptz,
  delegation_approved_by uuid references auth.users(id) on delete set null,
  partner_approved_at timestamptz,
  partner_approved_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'cancelled')),
  meeting_id uuid unique references public.meetings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meeting_proposals_match_admin_fkey
    foreign key (match_id, admin_id)
    references public.matches(id, admin_id)
    on delete cascade,
  constraint meeting_proposals_delegation_approval_pair_check
    check (
      (delegation_approved_at is null and delegation_approved_by is null)
      or
      (delegation_approved_at is not null and delegation_approved_by is not null)
    ),
  constraint meeting_proposals_partner_approval_pair_check
    check (
      (partner_approved_at is null and partner_approved_by is null)
      or
      (partner_approved_at is not null and partner_approved_by is not null)
    ),
  constraint meeting_proposals_status_evidence_check
    check (
      (
        status = 'pending'
        and meeting_id is null
      )
      or
      (
        status = 'approved'
        and meeting_id is not null
        and delegation_approved_at is not null
        and partner_approved_at is not null
      )
      or status = 'cancelled'
    )
);

create unique index meeting_proposals_one_pending_per_match_idx
  on public.meeting_proposals(match_id, admin_id)
  where status = 'pending';

create index meeting_proposals_admin_status_created_idx
  on public.meeting_proposals(admin_id, status, created_at desc);

create index meeting_proposals_requested_interpreter_idx
  on public.meeting_proposals(requested_interpreter_id)
  where requested_interpreter_id is not null;

create or replace trigger touch_meeting_proposals_updated_at
  before update on public.meeting_proposals
  for each row execute function public.touch_updated_at();

-- Existing Vendor-created placeholders did not record which company selected
-- the time. Convert future placeholders into neutral proposals and require both
-- Vendors to approve them again. Completed historical meetings remain intact.
insert into public.meeting_proposals (
  admin_id,
  match_id,
  starts_at,
  duration_minutes,
  requested_interpreter_id,
  requested_by_vendor_type,
  requested_by_vendor_company_id,
  status,
  created_at,
  updated_at
)
select
  meeting.admin_id,
  meeting.match_id,
  meeting.starts_at,
  meeting.duration_minutes,
  meeting.requested_interpreter_id,
  null,
  null,
  'pending',
  meeting.created_at,
  meeting.updated_at
from public.meetings meeting
join public.matches match
  on match.id = meeting.match_id
 and match.admin_id = meeting.admin_id
where meeting.platform = 'Pending'
  and meeting.link = ''
  and meeting.status = 'Scheduled'
  and meeting.starts_at > now()
  and match.delegation_accepted_at is not null
  and match.partner_accepted_at is not null
on conflict do nothing;

delete from public.meetings meeting
where meeting.platform = 'Pending'
  and meeting.link = ''
  and meeting.status = 'Scheduled'
  and meeting.starts_at > now()
  and exists (
    select 1
    from public.meeting_proposals proposal
    where proposal.match_id = meeting.match_id
      and proposal.admin_id = meeting.admin_id
      and proposal.starts_at = meeting.starts_at
      and proposal.status = 'pending'
  );

update public.matches match
set status = 'Accepted'
where match.status = 'Session Scheduled'
  and match.delegation_accepted_at is not null
  and match.partner_accepted_at is not null
  and exists (
    select 1
    from public.meeting_proposals proposal
    where proposal.match_id = match.id
      and proposal.admin_id = match.admin_id
      and proposal.status = 'pending'
  )
  and not exists (
    select 1
    from public.meetings meeting
    where meeting.match_id = match.id
      and meeting.admin_id = match.admin_id
      and meeting.status in ('Scheduled', 'Live')
  );

create or replace function private.enforce_vendor_meeting_proposal()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor_role text := public.current_app_role();
  actor_vendor_type text := public.current_vendor_type();
  actor_vendor_id uuid := public.current_vendor_company_id();
  actor_user_id uuid := auth.uid();
  match_row public.matches%rowtype;
  slot_day text;
  slot_time text;
  slot_is_open boolean;
begin
  if actor_role is distinct from 'vendor'
    or actor_user_id is null
    or not (select private.current_actor_is_active())
  then
    raise exception using
      errcode = '42501',
      message = 'Only an active Vendor can propose or approve a meeting';
  end if;

  select match.*
  into match_row
  from public.matches match
  where match.id = coalesce(new.match_id, old.match_id)
    and match.admin_id = coalesce(new.admin_id, old.admin_id)
  for update;

  if match_row.id is null
    or actor_vendor_id not in (
      match_row.delegation_company_id,
      match_row.partner_company_id
    )
    or (
      actor_vendor_type = 'delegation'
      and actor_vendor_id is distinct from match_row.delegation_company_id
    )
    or (
      actor_vendor_type = 'partner'
      and actor_vendor_id is distinct from match_row.partner_company_id
    )
  then
    raise exception using
      errcode = '42501',
      message = 'This Vendor does not participate in the match';
  end if;

  if match_row.delegation_accepted_at is null
    or match_row.partner_accepted_at is null
    or match_row.status not in ('Accepted', 'Session Scheduled')
  then
    raise exception using
      errcode = '23514',
      message = 'Both Vendors must accept the match before proposing a meeting';
  end if;

  if tg_op = 'INSERT' then
    if new.starts_at <= now() then
      raise exception using
        errcode = '23514',
        message = 'Choose a future meeting time';
    end if;

    if exists (
      select 1
      from public.meetings meeting
      where meeting.match_id = match_row.id
        and meeting.admin_id = match_row.admin_id
        and meeting.status in ('Scheduled', 'Live')
        and meeting.starts_at > now()
    ) then
      raise exception using
        errcode = '23505',
        message = 'A future meeting already exists for this match';
    end if;

    new.admin_id := match_row.admin_id;
    new.requested_by_vendor_type := actor_vendor_type;
    new.requested_by_vendor_company_id := actor_vendor_id;
    new.status := 'pending';
    new.meeting_id := null;

    if actor_vendor_type = 'delegation' then
      new.delegation_approved_at := now();
      new.delegation_approved_by := actor_user_id;
      new.partner_approved_at := null;
      new.partner_approved_by := null;
    else
      new.partner_approved_at := now();
      new.partner_approved_by := actor_user_id;
      new.delegation_approved_at := null;
      new.delegation_approved_by := null;
    end if;
  else
    if (
      old.id is distinct from new.id
      or old.admin_id is distinct from new.admin_id
      or old.match_id is distinct from new.match_id
      or old.starts_at is distinct from new.starts_at
      or old.duration_minutes is distinct from new.duration_minutes
      or old.requested_interpreter_id is distinct from new.requested_interpreter_id
      or old.requested_by_vendor_type is distinct from new.requested_by_vendor_type
      or old.requested_by_vendor_company_id is distinct from new.requested_by_vendor_company_id
      or old.created_at is distinct from new.created_at
      or old.status is distinct from 'pending'
      or new.status is distinct from 'pending'
      or old.meeting_id is not null
      or new.meeting_id is not null
    ) then
      raise exception using
        errcode = '42501',
        message = 'Vendors can only approve their own side of a pending proposal';
    end if;

    if actor_vendor_type = 'delegation' then
      if old.partner_approved_at is distinct from new.partner_approved_at
        or old.partner_approved_by is distinct from new.partner_approved_by
      then
        raise exception using
          errcode = '42501',
          message = 'A Delegation Vendor cannot approve for the Partner';
      end if;

      if old.delegation_approved_at is not null then
        raise exception using
          errcode = '23505',
          message = 'The Delegation Vendor already approved this proposal';
      end if;

      new.delegation_approved_at := now();
      new.delegation_approved_by := actor_user_id;
    else
      if old.delegation_approved_at is distinct from new.delegation_approved_at
        or old.delegation_approved_by is distinct from new.delegation_approved_by
      then
        raise exception using
          errcode = '42501',
          message = 'A Partner Vendor cannot approve for the Delegation';
      end if;

      if old.partner_approved_at is not null then
        raise exception using
          errcode = '23505',
          message = 'The Partner Vendor already approved this proposal';
      end if;

      new.partner_approved_at := now();
      new.partner_approved_by := actor_user_id;
    end if;
  end if;

  slot_day := extract(
    isodow from new.starts_at at time zone 'Asia/Kuala_Lumpur'
  )::integer::text;
  slot_time := to_char(
    new.starts_at at time zone 'Asia/Kuala_Lumpur',
    'HH24:MI'
  );

  select coalesce(
    tenant.meeting_availability -> slot_day ? slot_time,
    false
  )
  into slot_is_open
  from public.admin_tenants tenant
  where tenant.id = match_row.admin_id;

  if not slot_is_open then
    raise exception using
      errcode = '23514',
      message = 'That meeting time is no longer open';
  end if;

  if new.delegation_approved_at is not null
    and new.partner_approved_at is not null
  then
    if new.starts_at <= now() then
      raise exception using
        errcode = '23514',
        message = 'The proposed meeting time has passed';
    end if;

    if exists (
      select 1
      from public.meetings meeting
      where meeting.match_id = match_row.id
        and meeting.admin_id = match_row.admin_id
        and meeting.status in ('Scheduled', 'Live')
        and meeting.starts_at > now()
    ) then
      raise exception using
        errcode = '23505',
        message = 'A future meeting already exists for this match';
    end if;

    new.meeting_id := gen_random_uuid();
    new.status := 'approved';

    insert into public.meetings (
      id,
      admin_id,
      match_id,
      starts_at,
      duration_minutes,
      platform,
      link,
      interpreter,
      requested_interpreter_id,
      host,
      status,
      summary
    ) values (
      new.meeting_id,
      match_row.admin_id,
      match_row.id,
      new.starts_at,
      new.duration_minutes,
      'Pending',
      '',
      'To be confirmed',
      new.requested_interpreter_id,
      'Plexus meeting host',
      'Scheduled',
      'Both Vendors approved the proposed meeting time. The Admin can now create the protected Zoom or Lark session.'
    );
  end if;

  return new;
end
$$;

revoke all on function private.enforce_vendor_meeting_proposal() from public;
revoke all on function private.enforce_vendor_meeting_proposal() from anon;
revoke all on function private.enforce_vendor_meeting_proposal() from authenticated;

create trigger enforce_vendor_meeting_proposal
  before insert or update on public.meeting_proposals
  for each row execute function private.enforce_vendor_meeting_proposal();

alter table public.meeting_proposals enable row level security;

create policy "meeting proposals select access"
  on public.meeting_proposals for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
      or (
        public.current_app_role() = 'vendor'
        and admin_id = public.current_admin_id()
        and exists (
          select 1
          from public.matches match
          where match.id = meeting_proposals.match_id
            and match.admin_id = meeting_proposals.admin_id
            and (
              match.delegation_company_id = public.current_vendor_company_id()
              or match.partner_company_id = public.current_vendor_company_id()
            )
        )
      )
    )
  );

create policy "meeting proposals insert access"
  on public.meeting_proposals for insert to authenticated
  with check (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'vendor'
    and admin_id = public.current_admin_id()
    and exists (
      select 1
      from public.matches match
      where match.id = meeting_proposals.match_id
        and match.admin_id = meeting_proposals.admin_id
        and (
          match.delegation_company_id = public.current_vendor_company_id()
          or match.partner_company_id = public.current_vendor_company_id()
        )
    )
  );

create policy "meeting proposals update access"
  on public.meeting_proposals for update to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'vendor'
    and status = 'pending'
    and admin_id = public.current_admin_id()
    and exists (
      select 1
      from public.matches match
      where match.id = meeting_proposals.match_id
        and match.admin_id = meeting_proposals.admin_id
        and (
          match.delegation_company_id = public.current_vendor_company_id()
          or match.partner_company_id = public.current_vendor_company_id()
        )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'vendor'
    and admin_id = public.current_admin_id()
    and exists (
      select 1
      from public.matches match
      where match.id = meeting_proposals.match_id
        and match.admin_id = meeting_proposals.admin_id
        and (
          match.delegation_company_id = public.current_vendor_company_id()
          or match.partner_company_id = public.current_vendor_company_id()
        )
    )
  );

revoke all on public.meeting_proposals from public;
revoke all on public.meeting_proposals from anon;
revoke all on public.meeting_proposals from authenticated;

grant select, insert, update on public.meeting_proposals to authenticated;
grant select, insert, update, delete on public.meeting_proposals to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'meeting_proposals'
  ) then
    alter publication supabase_realtime add table public.meeting_proposals;
  end if;
end
$$;

comment on table public.meeting_proposals is
  'Tenant-scoped Vendor meeting times awaiting approval from both matched companies.';
comment on column public.meeting_proposals.meeting_id is
  'Populated atomically only when both Vendors approve; references the resulting canonical meeting.';
