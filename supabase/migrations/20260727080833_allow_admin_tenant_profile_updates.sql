create or replace function private.protect_admin_tenant_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.current_app_role() = 'admin'
    and (
      old.id is distinct from new.id
      or old.slug is distinct from new.slug
      or old.status is distinct from new.status
      or old.created_at is distinct from new.created_at
    )
  then
    raise exception 'Admins may update only permitted tenant profile fields';
  end if;

  return new;
end
$$;

revoke all on function private.protect_admin_tenant_update() from public;
revoke all on function private.protect_admin_tenant_update() from anon;
revoke all on function private.protect_admin_tenant_update() from authenticated;

drop trigger if exists protect_admin_tenant_update
  on public.admin_tenants;
create trigger protect_admin_tenant_update
  before update on public.admin_tenants
  for each row execute function private.protect_admin_tenant_update();

drop policy if exists "superadmin updates tenants"
  on public.admin_tenants;

create policy "operator updates permitted tenant fields"
  on public.admin_tenants for update to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and id = public.current_admin_id()
      )
    )
  );
