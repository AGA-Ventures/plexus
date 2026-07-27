-- GoTrue's Auth Admin create-user workflow can write the trusted custom
-- app_metadata after the initial auth.users INSERT. Plexus provisioning always
-- creates confirmed users from a server-only Admin client, while public signup
-- remains disabled and cannot choose email_confirmed_at.
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
  if new.email_confirmed_at is not null then
    return new;
  end if;

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
