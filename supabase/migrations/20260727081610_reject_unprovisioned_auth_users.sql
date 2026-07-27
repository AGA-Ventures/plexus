-- Defense in depth for projects whose Auth provider toggle is accidentally
-- left open. Public sign-up can populate user_metadata, but it cannot set the
-- trusted app_metadata contract checked here. Auth Admin API provisioning
-- supplies these claims before the Auth row is inserted.
create or replace function private.reject_unprovisioned_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_role text := new.raw_app_meta_data ->> 'role';
  claimed_admin_id text := new.raw_app_meta_data ->> 'admin_id';
  claimed_vendor_id text := new.raw_app_meta_data ->> 'vendor_company_id';
  claimed_vendor_type text := new.raw_app_meta_data ->> 'vendor_type';
  uuid_pattern constant text :=
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
begin
  if claimed_role = 'superadmin'
    and claimed_admin_id is null
    and claimed_vendor_id is null
    and claimed_vendor_type is null
  then
    return new;
  end if;

  if claimed_role = 'admin'
    and claimed_admin_id ~* uuid_pattern
    and claimed_vendor_id is null
    and claimed_vendor_type is null
  then
    return new;
  end if;

  if claimed_role = 'vendor'
    and claimed_admin_id ~* uuid_pattern
    and claimed_vendor_id ~* uuid_pattern
    and claimed_vendor_type in ('delegation', 'partner')
  then
    return new;
  end if;

  raise exception
    'Plexus accounts must be provisioned through an authorized Auth Admin workflow'
    using errcode = '42501';
end
$$;

revoke all on function private.reject_unprovisioned_auth_user() from public;
revoke all on function private.reject_unprovisioned_auth_user() from anon;
revoke all on function private.reject_unprovisioned_auth_user()
  from authenticated;

drop trigger if exists enforce_plexus_auth_provisioning
  on auth.users;
create trigger enforce_plexus_auth_provisioning
  before insert on auth.users
  for each row execute function private.reject_unprovisioned_auth_user();
