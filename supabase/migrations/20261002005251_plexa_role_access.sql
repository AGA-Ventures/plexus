insert into public.platform_settings (
  setting_key,
  category,
  value,
  description
)
values (
  'plexa_role_access',
  'permissions',
  '{"admin": true, "vendor": true}'::jsonb,
  'Controls whether the interactive PLEXA demo is visible in Admin and Vendor workspaces.'
)
on conflict (setting_key) do nothing;

drop policy if exists "authorized operators select platform settings"
  on public.platform_settings;

create policy "authorized operators select platform settings"
  on public.platform_settings for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and setting_key in (
          'vendor_account_provisioning',
          'plexa_role_access'
        )
      )
      or (
        public.current_app_role() = 'vendor'
        and setting_key = 'plexa_role_access'
      )
    )
  );
