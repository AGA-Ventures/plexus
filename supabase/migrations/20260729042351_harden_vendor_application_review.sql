-- Keep rejection service-only and cover application review foreign keys.
create index if not exists vendor_applications_reviewed_by_idx
  on public.vendor_applications (reviewed_by)
  where reviewed_by is not null;

create index if not exists vendor_applications_auth_user_id_idx
  on public.vendor_applications (auth_user_id)
  where auth_user_id is not null;

drop function if exists public.reject_vendor_application(uuid);

create or replace function public.reject_vendor_application(
  p_application_id uuid,
  p_admin_id uuid,
  p_actor_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  rejected_id uuid;
  rejected_type text;
begin
  if not exists (
    select 1
    from public.user_profiles profile
    join public.admin_tenants tenant
      on tenant.id = profile.admin_id
    where profile.id = p_actor_user_id
      and profile.role = 'admin'
      and profile.admin_id = p_admin_id
      and profile.active
      and tenant.status = 'active'
  ) then
    raise exception 'Active owning Admin access is required'
      using errcode = '42501';
  end if;

  update public.vendor_applications
  set
    status = 'rejected',
    reviewed_by = p_actor_user_id,
    reviewed_at = now()
  where id = p_application_id
    and admin_id = p_admin_id
    and status = 'pending'
  returning id, vendor_type into rejected_id, rejected_type;

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
    p_actor_user_id,
    'admin',
    'reject_vendor_application',
    'vendor_applications',
    rejected_id,
    p_admin_id,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object(
      'status', 'rejected',
      'vendor_type', rejected_type
    )
  );

  return true;
end
$$;

revoke all on function public.reject_vendor_application(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.reject_vendor_application(uuid, uuid, uuid)
  to service_role;
