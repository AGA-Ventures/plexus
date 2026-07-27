create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique
    check (setting_key ~ '^[a-z][a-z0-9_]*$'),
  category text not null
    check (category in ('plans', 'permissions', 'reference', 'operations')),
  value jsonb not null default 'null'::jsonb,
  description text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger touch_platform_settings_updated_at
  before update on public.platform_settings
  for each row execute function public.touch_updated_at();

create index if not exists platform_settings_category_idx
  on public.platform_settings(category);
create index if not exists platform_settings_updated_by_idx
  on public.platform_settings(updated_by);

alter table public.platform_settings enable row level security;

revoke all on public.platform_settings from anon;
revoke all on public.platform_settings from authenticated;
grant select, insert, update, delete
  on public.platform_settings to authenticated;

create policy "superadmin selects platform settings"
  on public.platform_settings for select to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  );

create policy "superadmin inserts platform settings"
  on public.platform_settings for insert to authenticated
  with check (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
    and updated_by = (select auth.uid())
  );

create policy "superadmin updates platform settings"
  on public.platform_settings for update to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  )
  with check (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
    and updated_by = (select auth.uid())
  );

create policy "superadmin deletes platform settings"
  on public.platform_settings for delete to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  );

drop trigger if exists audit_platform_settings
  on public.platform_settings;
create trigger audit_platform_settings
  after insert or update or delete on public.platform_settings
  for each row execute function private.audit_privileged_change();

insert into public.platform_settings (
  setting_key,
  category,
  value,
  description
)
values
  (
    'default_admin_plan',
    'plans',
    '"standard"'::jsonb,
    'Default plan assigned when a new Admin tenant is provisioned.'
  ),
  (
    'vendor_account_provisioning',
    'permissions',
    'true'::jsonb,
    'Whether approved Admins may provision Vendor Auth accounts.'
  ),
  (
    'supported_markets',
    'reference',
    '["Malaysia", "China", "Macao"]'::jsonb,
    'Platform reference list used by operational configuration.'
  ),
  (
    'operations_notice',
    'operations',
    '""'::jsonb,
    'Platform-wide operations notice maintained by Plexus.'
  )
on conflict (setting_key) do nothing;
