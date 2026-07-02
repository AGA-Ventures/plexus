drop policy if exists "admin manages user profiles" on public.user_profiles;
drop policy if exists "users read own profile" on public.user_profiles;
drop policy if exists "admin manages delegation companies" on public.delegation_companies;
drop policy if exists "delegation reads own company" on public.delegation_companies;
drop policy if exists "delegation updates own company" on public.delegation_companies;
drop policy if exists "admin manages partner companies" on public.partner_companies;
drop policy if exists "partner reads own company" on public.partner_companies;
drop policy if exists "partner updates own company" on public.partner_companies;
drop policy if exists "admin manages matches" on public.matches;
drop policy if exists "delegation reads related matches" on public.matches;
drop policy if exists "delegation updates related match status" on public.matches;
drop policy if exists "partner reads related matches" on public.matches;
drop policy if exists "partner updates related match status" on public.matches;
drop policy if exists "admin manages meetings" on public.meetings;
drop policy if exists "delegation reads related meetings" on public.meetings;
drop policy if exists "partner reads related meetings" on public.meetings;
drop policy if exists "admin manages deals" on public.deals;
drop policy if exists "delegation reads related deals" on public.deals;
drop policy if exists "partner reads related deals" on public.deals;
drop policy if exists "authenticated users read itinerary" on public.itinerary_slots;
drop policy if exists "admin manages itinerary" on public.itinerary_slots;
drop policy if exists "admin manages site visits" on public.site_visits;
drop policy if exists "delegation reads related site visits" on public.site_visits;
drop policy if exists "admin manages site visit delegations" on public.site_visit_delegations;
drop policy if exists "delegation reads own site visit delegations" on public.site_visit_delegations;
drop policy if exists "authenticated users read liaison contacts" on public.liaison_contacts;
drop policy if exists "admin manages liaison contacts" on public.liaison_contacts;
drop policy if exists "authenticated users read notifications" on public.notifications;
drop policy if exists "admin manages notifications" on public.notifications;

create policy "user profiles select access"
  on public.user_profiles for select to authenticated
  using (public.current_app_role() = 'admin' or (select auth.uid()) = id);
create policy "admin inserts user profiles"
  on public.user_profiles for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "admin updates user profiles"
  on public.user_profiles for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "admin deletes user profiles"
  on public.user_profiles for delete to authenticated
  using (public.current_app_role() = 'admin');

create policy "delegation companies select access"
  on public.delegation_companies for select to authenticated
  using (
    public.current_app_role() = 'admin'
    or (public.current_app_role() = 'delegation' and id = public.current_delegation_company_id())
  );
create policy "admin inserts delegation companies"
  on public.delegation_companies for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "delegation companies update access"
  on public.delegation_companies for update to authenticated
  using (
    public.current_app_role() = 'admin'
    or (public.current_app_role() = 'delegation' and id = public.current_delegation_company_id())
  )
  with check (
    public.current_app_role() = 'admin'
    or (public.current_app_role() = 'delegation' and id = public.current_delegation_company_id())
  );
create policy "admin deletes delegation companies"
  on public.delegation_companies for delete to authenticated
  using (public.current_app_role() = 'admin');

create policy "partner companies select access"
  on public.partner_companies for select to authenticated
  using (
    public.current_app_role() = 'admin'
    or (public.current_app_role() = 'partner' and id = public.current_partner_company_id())
  );
create policy "admin inserts partner companies"
  on public.partner_companies for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "partner companies update access"
  on public.partner_companies for update to authenticated
  using (
    public.current_app_role() = 'admin'
    or (public.current_app_role() = 'partner' and id = public.current_partner_company_id())
  )
  with check (
    public.current_app_role() = 'admin'
    or (public.current_app_role() = 'partner' and id = public.current_partner_company_id())
  );
create policy "admin deletes partner companies"
  on public.partner_companies for delete to authenticated
  using (public.current_app_role() = 'admin');

create policy "matches select access"
  on public.matches for select to authenticated
  using (
    public.current_app_role() = 'admin'
    or (public.current_app_role() = 'delegation' and delegation_company_id = public.current_delegation_company_id())
    or (public.current_app_role() = 'partner' and partner_company_id = public.current_partner_company_id())
  );
create policy "admin inserts matches"
  on public.matches for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "matches update access"
  on public.matches for update to authenticated
  using (
    public.current_app_role() = 'admin'
    or (public.current_app_role() = 'delegation' and delegation_company_id = public.current_delegation_company_id())
    or (public.current_app_role() = 'partner' and partner_company_id = public.current_partner_company_id())
  )
  with check (
    public.current_app_role() = 'admin'
    or (public.current_app_role() = 'delegation' and delegation_company_id = public.current_delegation_company_id())
    or (public.current_app_role() = 'partner' and partner_company_id = public.current_partner_company_id())
  );
create policy "admin deletes matches"
  on public.matches for delete to authenticated
  using (public.current_app_role() = 'admin');

create policy "meetings select access"
  on public.meetings for select to authenticated
  using (
    public.current_app_role() = 'admin'
    or exists (
      select 1 from public.matches
      where matches.id = meetings.match_id
      and (
        (public.current_app_role() = 'delegation' and matches.delegation_company_id = public.current_delegation_company_id())
        or (public.current_app_role() = 'partner' and matches.partner_company_id = public.current_partner_company_id())
      )
    )
  );
create policy "admin inserts meetings"
  on public.meetings for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "admin updates meetings"
  on public.meetings for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "admin deletes meetings"
  on public.meetings for delete to authenticated
  using (public.current_app_role() = 'admin');

create policy "deals select access"
  on public.deals for select to authenticated
  using (
    public.current_app_role() = 'admin'
    or exists (
      select 1 from public.matches
      where matches.id = deals.match_id
      and (
        (public.current_app_role() = 'delegation' and matches.delegation_company_id = public.current_delegation_company_id())
        or (public.current_app_role() = 'partner' and matches.partner_company_id = public.current_partner_company_id())
      )
    )
  );
create policy "admin inserts deals"
  on public.deals for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "admin updates deals"
  on public.deals for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "admin deletes deals"
  on public.deals for delete to authenticated
  using (public.current_app_role() = 'admin');

create policy "itinerary select access"
  on public.itinerary_slots for select to authenticated
  using (true);
create policy "admin inserts itinerary"
  on public.itinerary_slots for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "admin updates itinerary"
  on public.itinerary_slots for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "admin deletes itinerary"
  on public.itinerary_slots for delete to authenticated
  using (public.current_app_role() = 'admin');

create policy "site visits select access"
  on public.site_visits for select to authenticated
  using (
    public.current_app_role() = 'admin'
    or (
      public.current_app_role() = 'delegation'
      and exists (
        select 1 from public.site_visit_delegations
        where site_visit_delegations.site_visit_id = site_visits.id
        and site_visit_delegations.delegation_company_id = public.current_delegation_company_id()
      )
    )
  );
create policy "admin inserts site visits"
  on public.site_visits for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "admin updates site visits"
  on public.site_visits for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "admin deletes site visits"
  on public.site_visits for delete to authenticated
  using (public.current_app_role() = 'admin');

create policy "site visit delegations select access"
  on public.site_visit_delegations for select to authenticated
  using (
    public.current_app_role() = 'admin'
    or (public.current_app_role() = 'delegation' and delegation_company_id = public.current_delegation_company_id())
  );
create policy "admin inserts site visit delegations"
  on public.site_visit_delegations for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "admin updates site visit delegations"
  on public.site_visit_delegations for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "admin deletes site visit delegations"
  on public.site_visit_delegations for delete to authenticated
  using (public.current_app_role() = 'admin');

create policy "liaison contacts select access"
  on public.liaison_contacts for select to authenticated
  using (true);
create policy "admin inserts liaison contacts"
  on public.liaison_contacts for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "admin updates liaison contacts"
  on public.liaison_contacts for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "admin deletes liaison contacts"
  on public.liaison_contacts for delete to authenticated
  using (public.current_app_role() = 'admin');

create policy "notifications select access"
  on public.notifications for select to authenticated
  using (true);
create policy "admin inserts notifications"
  on public.notifications for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "admin updates notifications"
  on public.notifications for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "admin deletes notifications"
  on public.notifications for delete to authenticated
  using (public.current_app_role() = 'admin');

