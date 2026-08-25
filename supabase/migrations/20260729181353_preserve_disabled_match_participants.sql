create or replace function public.match_participants()
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
      from public.matches participating_match
      where participating_match.admin_id = public.current_admin_id()
        and (
          (
            public.current_vendor_type() = 'delegation'
            and participating_match.delegation_company_id =
              public.current_vendor_company_id()
            and participating_match.partner_company_id = directory.id
          )
          or (
            public.current_vendor_type() = 'partner'
            and participating_match.partner_company_id =
              public.current_vendor_company_id()
            and participating_match.delegation_company_id = directory.id
          )
        )
    )
$$;

revoke all on function public.match_participants() from public;
revoke all on function public.match_participants() from anon;
grant execute on function public.match_participants() to authenticated;
