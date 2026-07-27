drop policy if exists "superadmin selects platform settings"
  on public.platform_settings;

create policy "authorized operators select platform settings"
  on public.platform_settings for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and setting_key = 'vendor_account_provisioning'
      )
    )
  );
