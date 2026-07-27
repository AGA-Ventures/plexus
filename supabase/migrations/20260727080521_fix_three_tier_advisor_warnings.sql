-- Keep one permissive SELECT policy per tenant-wide workflow table. The
-- original FOR ALL operator policies also applied to SELECT and duplicated the
-- dedicated read policy, so split operator writes by command.
do $$
declare
  table_name text;
  old_policy_name text;
begin
  for table_name, old_policy_name in
    select *
    from (
      values
        ('itinerary_slots', 'operator manages itinerary'),
        ('site_visits', 'operator manages site visits'),
        ('site_visit_delegations', 'operator manages site visit assignments'),
        ('liaison_contacts', 'operator manages liaison'),
        ('notifications', 'operator manages notifications'),
        ('announcements', 'operator manages announcements'),
        ('event_resources', 'operator manages resources'),
        ('interpreters', 'operator manages interpreters')
    ) as policies(table_name, old_policy_name)
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      old_policy_name,
      table_name
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated
       with check (
         (select private.current_actor_is_active())
         and (
           public.current_app_role() = ''superadmin''
           or (
             public.current_app_role() = ''admin''
             and admin_id = public.current_admin_id()
           )
         )
       )',
      'operator inserts ' || table_name,
      table_name
    );

    execute format(
      'create policy %I on public.%I for update to authenticated
       using (
         (select private.current_actor_is_active())
         and (
           public.current_app_role() = ''superadmin''
           or (
             public.current_app_role() = ''admin''
             and admin_id = public.current_admin_id()
           )
         )
       )
       with check (
         (select private.current_actor_is_active())
         and (
           public.current_app_role() = ''superadmin''
           or (
             public.current_app_role() = ''admin''
             and admin_id = public.current_admin_id()
           )
         )
       )',
      'operator updates ' || table_name,
      table_name
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated
       using (
         (select private.current_actor_is_active())
         and (
           public.current_app_role() = ''superadmin''
           or (
             public.current_app_role() = ''admin''
             and admin_id = public.current_admin_id()
           )
         )
       )',
      'operator deletes ' || table_name,
      table_name
    );
  end loop;
end
$$;

-- Cover every composite/standalone foreign key reported by the database
-- advisor. Tenant indexes remain intentionally present even before production
-- traffic because they support the RLS predicates on every request.
create index if not exists deals_match_admin_idx
  on public.deals(match_id, admin_id);
create index if not exists matches_delegation_admin_idx
  on public.matches(delegation_company_id, admin_id);
create index if not exists matches_partner_admin_idx
  on public.matches(partner_company_id, admin_id);
create index if not exists meetings_match_admin_idx
  on public.meetings(match_id, admin_id);
create index if not exists user_profiles_vendor_admin_idx
  on public.user_profiles(vendor_company_id, admin_id);
create index if not exists user_profiles_vendor_type_idx
  on public.user_profiles(vendor_company_id, vendor_type);
create index if not exists vendor_companies_created_by_idx
  on public.vendor_companies(created_by);
