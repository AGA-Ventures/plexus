-- Approval-gated public Vendor applications for tenant-managed onboarding.
create table public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null
    references public.admin_tenants(id) on delete restrict,
  vendor_type text not null
    check (vendor_type in ('delegation', 'partner')),
  normalized_email text not null
    check (
      normalized_email = lower(btrim(normalized_email))
      and char_length(normalized_email) between 3 and 320
    ),
  contact_name text not null
    check (char_length(btrim(contact_name)) between 1 and 160),
  company_name text not null
    check (char_length(btrim(company_name)) between 1 and 240),
  profile_data jsonb not null
    check (jsonb_typeof(profile_data) = 'object'),
  profile_complete integer not null default 100
    check (profile_complete = 100),
  status text not null default 'pending'
    check (status in ('pending', 'provisioning', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  vendor_company_id uuid
    references public.vendor_companies(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  setup_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_applications_review_state_check check (
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
      and vendor_company_id is not null
      and auth_user_id is not null
    )
  )
);

create unique index vendor_applications_non_rejected_email_idx
  on public.vendor_applications (normalized_email)
  where status <> 'rejected';

create index vendor_applications_admin_status_created_idx
  on public.vendor_applications (admin_id, status, created_at desc);

create index vendor_applications_vendor_company_idx
  on public.vendor_applications (vendor_company_id)
  where vendor_company_id is not null;

create or replace function private.protect_vendor_application_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.admin_id is distinct from new.admin_id
    or old.vendor_type is distinct from new.vendor_type
    or old.normalized_email is distinct from new.normalized_email
    or old.contact_name is distinct from new.contact_name
    or old.company_name is distinct from new.company_name
    or old.profile_data is distinct from new.profile_data
    or old.profile_complete is distinct from new.profile_complete
    or old.created_at is distinct from new.created_at
  then
    raise exception 'Vendor application identity and profile fields are immutable';
  end if;

  if coalesce((select auth.jwt()->>'role'), '') <> 'service_role'
    and current_user not in ('postgres', 'supabase_admin')
  then
    raise exception
      'Vendor application provisioning requires a trusted server workflow'
      using errcode = '42501';
  end if;

  if not (
    (old.status = 'pending' and new.status in ('provisioning', 'rejected'))
    or (old.status = 'provisioning' and new.status in ('pending', 'approved'))
    or (
      old.status = 'approved'
      and new.status = 'approved'
      and old.reviewed_by is not distinct from new.reviewed_by
      and old.reviewed_at is not distinct from new.reviewed_at
      and old.vendor_company_id is not distinct from new.vendor_company_id
      and old.auth_user_id is not distinct from new.auth_user_id
    )
  ) then
    raise exception 'Invalid Vendor application status transition';
  end if;

  return new;
end
$$;

revoke all on function private.protect_vendor_application_update()
  from public, anon, authenticated;

create trigger protect_vendor_application_update
  before update on public.vendor_applications
  for each row execute function private.protect_vendor_application_update();

create trigger touch_vendor_applications_updated_at
  before update on public.vendor_applications
  for each row execute function public.touch_updated_at();

alter table public.vendor_applications enable row level security;

create policy "vendor application governance select"
  on public.vendor_applications for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "vendor application governance update"
  on public.vendor_applications for update to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

revoke all on public.vendor_applications from public, anon, authenticated;
grant select, update on public.vendor_applications to authenticated;

create or replace function public.finalize_vendor_application_approval(
  p_application_id uuid,
  p_admin_id uuid,
  p_actor_user_id uuid,
  p_vendor_company_id uuid,
  p_auth_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  finalized_id uuid;
  finalized_type text;
begin
  update public.vendor_applications
  set
    status = 'approved',
    reviewed_by = p_actor_user_id,
    reviewed_at = now(),
    vendor_company_id = p_vendor_company_id,
    auth_user_id = p_auth_user_id
  where id = p_application_id
    and admin_id = p_admin_id
    and status = 'provisioning'
  returning id, vendor_type into finalized_id, finalized_type;

  if finalized_id is null then
    return false;
  end if;

  insert into public.audit_events (
    actor_user_id,
    actor_role,
    action,
    target_table,
    target_id,
    admin_id,
    before_values,
    after_values
  ) values (
    p_actor_user_id,
    'admin',
    'approve_vendor_application',
    'vendor_applications',
    finalized_id,
    p_admin_id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object(
      'status', 'approved',
      'vendor_company_id', p_vendor_company_id,
      'auth_user_id', p_auth_user_id,
      'vendor_type', finalized_type
    )
  );

  return true;
end
$$;

revoke all on function public.finalize_vendor_application_approval(
  uuid, uuid, uuid, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.finalize_vendor_application_approval(
  uuid, uuid, uuid, uuid, uuid
) to service_role;

create or replace function public.reject_vendor_application(
  p_application_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  rejected_id uuid;
  rejected_admin_id uuid;
  rejected_type text;
begin
  if not private.current_actor_is_active()
    or public.current_app_role() <> 'admin'
    or public.current_admin_id() is null
  then
    raise exception 'Active Admin access is required' using errcode = '42501';
  end if;

  update public.vendor_applications
  set
    status = 'rejected',
    reviewed_by = (select auth.uid()),
    reviewed_at = now()
  where id = p_application_id
    and admin_id = public.current_admin_id()
    and status = 'pending'
  returning id, admin_id, vendor_type
  into rejected_id, rejected_admin_id, rejected_type;

  if rejected_id is null then
    return false;
  end if;

  insert into public.audit_events (
    actor_user_id,
    actor_role,
    action,
    target_table,
    target_id,
    admin_id,
    before_values,
    after_values
  ) values (
    (select auth.uid()),
    'admin',
    'reject_vendor_application',
    'vendor_applications',
    rejected_id,
    rejected_admin_id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object(
      'status', 'rejected',
      'vendor_type', rejected_type
    )
  );

  return true;
end
$$;

revoke all on function public.reject_vendor_application(uuid)
  from public, anon;
grant execute on function public.reject_vendor_application(uuid)
  to authenticated;
