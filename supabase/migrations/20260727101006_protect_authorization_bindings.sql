-- Authorization bindings are changed only by Superadmin workflows or trusted
-- server/database maintenance. RLS still controls which rows an Admin may
-- manage, while these triggers prevent direct Data API calls from turning
-- ordinary profile edits into role, tenant, or Vendor reassignment.

create or replace function private.protect_vendor_authorization_binding()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    old.id is distinct from new.id
    or old.admin_id is distinct from new.admin_id
    or old.vendor_type is distinct from new.vendor_type
  )
  and current_user not in ('postgres', 'service_role', 'supabase_admin')
  and public.current_app_role() is distinct from 'superadmin'
  then
    raise exception
      using
        errcode = '42501',
        message = 'Only a Superadmin or trusted server workflow can change Vendor authorization bindings';
  end if;

  return new;
end
$$;

revoke all on function private.protect_vendor_authorization_binding() from public;
revoke all on function private.protect_vendor_authorization_binding() from anon;
revoke all on function private.protect_vendor_authorization_binding() from authenticated;

drop trigger if exists protect_vendor_authorization_binding
  on public.vendor_companies;
create trigger protect_vendor_authorization_binding
  before update on public.vendor_companies
  for each row execute function private.protect_vendor_authorization_binding();

create or replace function private.protect_profile_authorization_binding()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    old.id is distinct from new.id
    or old.role is distinct from new.role
    or old.admin_id is distinct from new.admin_id
    or old.vendor_company_id is distinct from new.vendor_company_id
    or old.vendor_type is distinct from new.vendor_type
  )
  and current_user not in ('postgres', 'service_role', 'supabase_admin')
  and public.current_app_role() is distinct from 'superadmin'
  then
    raise exception
      using
        errcode = '42501',
        message = 'Only a Superadmin or trusted server workflow can change account authorization bindings';
  end if;

  return new;
end
$$;

revoke all on function private.protect_profile_authorization_binding() from public;
revoke all on function private.protect_profile_authorization_binding() from anon;
revoke all on function private.protect_profile_authorization_binding() from authenticated;

drop trigger if exists protect_profile_authorization_binding
  on public.user_profiles;
create trigger protect_profile_authorization_binding
  before update on public.user_profiles
  for each row execute function private.protect_profile_authorization_binding();
