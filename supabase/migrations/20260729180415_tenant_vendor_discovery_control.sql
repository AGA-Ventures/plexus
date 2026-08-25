alter table public.admin_tenants
  add column if not exists vendor_discovery_enabled boolean not null default true;

comment on column public.admin_tenants.vendor_discovery_enabled is
  'Owning Admin control for Vendor self-service company discovery and match requests.';

create or replace function public.match_candidates()
returns table (id uuid, name_en text, name_cn text, sector text)
language sql
stable
security invoker
set search_path = ''
as $$
  select directory.id, directory.name_en, directory.name_cn, directory.sector
  from public.match_candidate_directory directory
  where (select private.current_actor_is_active())
    and public.current_app_role() = 'vendor'
    and directory.admin_id = public.current_admin_id()
    and directory.company_type <> public.current_vendor_type()
    and exists (
      select 1
      from public.admin_tenants tenant
      where tenant.id = directory.admin_id
        and tenant.vendor_discovery_enabled
    )
$$;

revoke all on function public.match_candidates() from public;
revoke all on function public.match_candidates() from anon;
grant execute on function public.match_candidates() to authenticated;

drop policy if exists "matches insert access" on public.matches;

create policy "matches insert access"
  on public.matches for insert to authenticated
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
      or (
        public.current_app_role() = 'vendor'
        and admin_id = public.current_admin_id()
        and exists (
          select 1
          from public.admin_tenants tenant
          where tenant.id = public.matches.admin_id
            and tenant.vendor_discovery_enabled
        )
        and (
          (
            public.current_vendor_type() = 'delegation'
            and delegation_company_id = public.current_vendor_company_id()
          )
          or (
            public.current_vendor_type() = 'partner'
            and partner_company_id = public.current_vendor_company_id()
          )
        )
      )
    )
  );
