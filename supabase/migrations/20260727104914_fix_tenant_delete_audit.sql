create or replace function private.audit_privileged_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_before jsonb;
  row_after jsonb;
  target_uuid uuid;
  tenant_uuid uuid;
begin
  row_before := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  row_after := case when tg_op = 'DELETE' then null else to_jsonb(new) end;

  target_uuid := case
    when tg_op = 'DELETE' then old.id
    else new.id
  end;

  tenant_uuid := case
    when tg_table_name = 'admin_tenants' and tg_op = 'DELETE' then null
    when tg_table_name = 'admin_tenants' then target_uuid
    when tg_op = 'DELETE' then nullif(row_before ->> 'admin_id', '')::uuid
    else nullif(row_after ->> 'admin_id', '')::uuid
  end;

  insert into public.audit_events (
    actor_user_id,
    actor_role,
    action,
    target_table,
    target_id,
    admin_id,
    request_id,
    before_values,
    after_values
  )
  values (
    (select auth.uid()),
    public.current_app_role(),
    lower(tg_op),
    tg_table_name,
    target_uuid,
    tenant_uuid,
    auth.jwt() ->> 'session_id',
    row_before,
    row_after
  );

  return coalesce(new, old);
end
$$;

revoke all on function private.audit_privileged_change() from public;
revoke all on function private.audit_privileged_change() from anon;
revoke all on function private.audit_privileged_change() from authenticated;
