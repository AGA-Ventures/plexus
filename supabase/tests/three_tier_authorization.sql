begin;

create extension if not exists pgtap with schema extensions;
select plan(83);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '81000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'rls-super@example.invalid', '',
    now(), '{"role":"superadmin"}', '{}', now(), now()
  ),
  (
    '81000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'rls-admin-a@example.invalid', '',
    now(), '{"role":"admin","admin_id":"82000000-0000-4000-8000-000000000001"}',
    '{}', now(), now()
  ),
  (
    '81000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'rls-admin-b@example.invalid', '',
    now(), '{"role":"admin","admin_id":"82000000-0000-4000-8000-000000000002"}',
    '{}', now(), now()
  ),
  (
    '81000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'rls-vendor-a@example.invalid', '',
    now(),
    '{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000001","vendor_type":"delegation"}',
    '{}', now(), now()
  ),
  (
    '81000000-0000-4000-8000-000000000005',
    '00000000-0000-0000-8000-000000000000',
    'authenticated', 'authenticated', 'rls-vendor-b@example.invalid', '',
    now(),
    '{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000002","vendor_company_id":"83000000-0000-4000-8000-000000000002","vendor_type":"partner"}',
    '{}', now(), now()
  ),
  (
    '81000000-0000-4000-8000-000000000006',
    '00000000-0000-4000-8000-000000000000',
    'authenticated', 'authenticated', 'rls-vendor-a-partner@example.invalid', '',
    now(),
    '{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000004","vendor_type":"partner"}',
    '{}', now(), now()
  );

insert into public.admin_tenants (id, slug, name)
values
  ('82000000-0000-4000-8000-000000000001', 'rls-tenant-a', 'RLS Tenant A'),
  ('82000000-0000-4000-8000-000000000002', 'rls-tenant-b', 'RLS Tenant B');

insert into public.vendor_companies (
  id, admin_id, vendor_type, name_en, sector
) values (
  '83000000-0000-4000-8000-000000000003',
  '82000000-0000-4000-8000-000000000001',
  'delegation', 'RLS Vendor A2', 'Testing'
), (
  '83000000-0000-4000-8000-000000000004',
  '82000000-0000-4000-8000-000000000001',
  'partner', 'RLS Vendor A Partner', 'Testing'
);

insert into public.delegation_companies (
  id, admin_id, vendor_company_id, vendor_type,
  name_en, name_cn, sector, origin, company_size, needs,
  contact, contact_meta, status, profile_complete, urgent, coordinator
) values (
  '83000000-0000-4000-8000-000000000001',
  '82000000-0000-4000-8000-000000000001',
  '83000000-0000-4000-8000-000000000001',
  'delegation', 'RLS Vendor A', '', 'Testing', 'Test', 'Test', '',
  'a@example.invalid', 'Test', 'Invited', 0, false, 'Test'
);

insert into public.partner_companies (
  id, admin_id, vendor_company_id, vendor_type,
  name_en, name_cn, sector, partner_type, company_size, offerings,
  contact, contact_meta, status, profile_complete, verified, attendance, arrived
) values (
  '83000000-0000-4000-8000-000000000002',
  '82000000-0000-4000-8000-000000000002',
  '83000000-0000-4000-8000-000000000002',
  'partner', 'RLS Vendor B', '', 'Testing', 'Enterprise', 'Test', '',
  'b@example.invalid', 'Test', 'Invited', 0, 'Pending', 'Invited', false
), (
  '83000000-0000-4000-8000-000000000004',
  '82000000-0000-4000-8000-000000000001',
  '83000000-0000-4000-8000-000000000004',
  'partner', 'RLS Vendor A Partner', '', 'Testing', 'Enterprise', 'Test', '',
  'a-partner@example.invalid', 'Test', 'Invited', 0, 'Pending', 'Invited', false
);

insert into public.user_profiles (
  id, role, display_name, email, admin_id, vendor_company_id, vendor_type, active
) values
  (
    '81000000-0000-4000-8000-000000000001',
    'superadmin', 'RLS Superadmin', 'rls-super@example.invalid',
    null, null, null, true
  ),
  (
    '81000000-0000-4000-8000-000000000002',
    'admin', 'RLS Admin A', 'rls-admin-a@example.invalid',
    '82000000-0000-4000-8000-000000000001', null, null, true
  ),
  (
    '81000000-0000-4000-8000-000000000003',
    'admin', 'RLS Admin B', 'rls-admin-b@example.invalid',
    '82000000-0000-4000-8000-000000000002', null, null, true
  ),
  (
    '81000000-0000-4000-8000-000000000004',
    'vendor', 'RLS Vendor A', 'rls-vendor-a@example.invalid',
    '82000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000001', 'delegation', true
  ),
  (
    '81000000-0000-4000-8000-000000000005',
    'vendor', 'RLS Vendor B', 'rls-vendor-b@example.invalid',
    '82000000-0000-4000-8000-000000000002',
    '83000000-0000-4000-8000-000000000002', 'partner', true
  ),
  (
    '81000000-0000-4000-8000-000000000006',
    'vendor', 'RLS Vendor A Partner',
    'rls-vendor-a-partner@example.invalid',
    '82000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000004', 'partner', true
  );

insert into public.vendor_applications (
  id, admin_id, vendor_type, normalized_email, contact_name, company_name,
  profile_data, profile_complete
) values (
  '86000000-0000-4000-8000-000000000001',
  '82000000-0000-4000-8000-000000000001',
  'delegation',
  'application-a@example.invalid',
  'Application A',
  'Application Vendor A',
  '{"companyNameEn":"Application Vendor A"}',
  100
), (
  '86000000-0000-4000-8000-000000000002',
  '82000000-0000-4000-8000-000000000002',
  'partner',
  'application-b@example.invalid',
  'Application B',
  'Application Vendor B',
  '{"companyNameEn":"Application Vendor B"}',
  100
);

set local role anon;
select throws_ok(
  $$select * from public.vendor_applications$$,
  '42501',
  'permission denied for table vendor_applications',
  'Anonymous users cannot read Vendor applications directly'
);
select throws_ok(
  $$insert into public.vendor_applications (
    admin_id, vendor_type, normalized_email, contact_name, company_name,
    profile_data, profile_complete
  ) values (
    '82000000-0000-4000-8000-000000000001',
    'delegation',
    'anonymous@example.invalid',
    'Anonymous',
    'Anonymous Vendor',
    '{}',
    100
  )$$,
  '42501',
  'permission denied for table vendor_applications',
  'Anonymous users cannot submit through the Data API'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin","admin_id":"82000000-0000-4000-8000-000000000001"}}';

select results_eq(
  $$select count(*) from public.admin_tenants where id in (
    '82000000-0000-4000-8000-000000000001',
    '82000000-0000-4000-8000-000000000002'
  )$$,
  array[1::bigint],
  'Admin sees only its own tenant'
);
select results_eq(
  $$select count(*) from public.vendor_companies where id in (
    '83000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000002'
  )$$,
  array[1::bigint],
  'Admin sees only Vendors in its tenant'
);
select results_eq(
  $$select count(*) from public.user_profiles
    where role = 'vendor'
      and id in (
        '81000000-0000-4000-8000-000000000004',
        '81000000-0000-4000-8000-000000000005'
      )$$,
  array[1::bigint],
  'Admin sees only Vendor accounts in its tenant'
);
select results_eq(
  $$select count(*) from public.vendor_applications$$,
  array[1::bigint],
  'Admin sees only Vendor applications in its tenant'
);
select is(
  (
    select id
    from public.vendor_applications
    where id = '86000000-0000-4000-8000-000000000002'
  ),
  null::uuid,
  'Foreign Admin Vendor applications are not visible'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000001","vendor_type":"delegation"}}';
select results_eq(
  $$select count(*) from public.match_candidates()$$,
  array[1::bigint],
  'Vendor can browse eligible own-tenant companies while discovery is enabled'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin","admin_id":"82000000-0000-4000-8000-000000000001"}}';
select lives_ok(
  $$update public.admin_tenants
    set vendor_discovery_enabled = false
    where id = '82000000-0000-4000-8000-000000000001'$$,
  'Owning Admin can disable Vendor discovery'
);
select lives_ok(
  $$update public.admin_tenants
    set meeting_availability =
      '{"1":["09:00","10:00"],"2":[],"3":["14:00"],"4":[],"5":["16:00"]}'::jsonb
    where id = '82000000-0000-4000-8000-000000000001'$$,
  'Owning Admin can publish tenant meeting availability'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000001","vendor_type":"delegation"}}';
select results_eq(
  $$with changed as (
      update public.admin_tenants
      set meeting_availability = '{"1":[],"2":[],"3":[],"4":[],"5":[]}'::jsonb
      where id = '82000000-0000-4000-8000-000000000001'
      returning id
    )
    select count(*) from changed$$,
  array[0::bigint],
  'Vendor cannot alter its Admin meeting availability'
);
select results_eq(
  $$select count(*) from public.match_candidates()$$,
  array[0::bigint],
  'Disabled discovery returns no company candidates to the Vendor'
);
select throws_ok(
  $$insert into public.matches (
    id, admin_id, delegation_company_id, partner_company_id,
    status, score, note
  ) values (
    '84000000-0000-4000-8000-000000000099',
    '82000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000004',
    'Proposed', 50, 'Blocked disabled discovery request'
  )$$,
  '42501',
  'new row violates row-level security policy for table "matches"',
  'Disabled discovery blocks direct Vendor match requests'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin","admin_id":"82000000-0000-4000-8000-000000000001"}}';
select throws_ok(
  $$insert into public.vendor_applications (
    admin_id, vendor_type, normalized_email, contact_name, company_name,
    profile_data, profile_complete
  ) values (
    '82000000-0000-4000-8000-000000000001',
    'delegation',
    'admin-direct@example.invalid',
    'Admin Direct',
    'Admin Direct Vendor',
    '{}',
    100
  )$$,
  '42501',
  'permission denied for table vendor_applications',
  'Admins cannot bypass the server-only application submission path'
);
select throws_ok(
  $$update public.vendor_applications
    set
      status = 'provisioning',
      reviewed_by = '81000000-0000-4000-8000-000000000002',
      reviewed_at = now()
    where id = '86000000-0000-4000-8000-000000000001'
      and status = 'pending'$$,
  '42501',
  'Vendor application provisioning requires a trusted server workflow',
  'Admin cannot bypass the trusted approval workflow through the Data API'
);
select results_eq(
  $$select status from public.vendor_applications
    where id = '86000000-0000-4000-8000-000000000001'$$,
  array['pending'::text],
  'Blocked direct approval leaves the application pending'
);
select throws_ok(
  $$select public.reject_vendor_application(
    '86000000-0000-4000-8000-000000000001',
    '82000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000002'
  )$$,
  '42501',
  'permission denied for function reject_vendor_application',
  'Owning Admin cannot invoke the privileged rejection function directly'
);
set local role service_role;
set local request.jwt.claims =
  '{"role":"service_role"}';
select lives_ok(
  $$select public.reject_vendor_application(
    '86000000-0000-4000-8000-000000000001',
    '82000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000002'
  )$$,
  'Trusted server can reject the owning Admin application'
);
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin","admin_id":"82000000-0000-4000-8000-000000000001"}}';
select results_eq(
  $$select count(*) from public.audit_events
    where action = 'reject_vendor_application'
      and target_id = '86000000-0000-4000-8000-000000000001'
      and actor_user_id = '81000000-0000-4000-8000-000000000002'$$,
  array[1::bigint],
  'Vendor application rejection records actor-attributed audit evidence'
);
select throws_ok(
  $$insert into public.vendor_companies (
    id, admin_id, vendor_type, name_en, sector
  ) values (
    '83000000-0000-4000-8000-000000000099',
    '82000000-0000-4000-8000-000000000002',
    'partner', 'Cross-tenant write', 'Testing'
  )$$,
  '42501',
  'new row violates row-level security policy for table "vendor_companies"',
  'Admin cannot write into another tenant'
);
select throws_ok(
  $$update public.user_profiles
    set vendor_company_id = '83000000-0000-4000-8000-000000000003'
    where id = '81000000-0000-4000-8000-000000000004'$$,
  '42501',
  'Only a Superadmin or trusted server workflow can change account authorization bindings',
  'Admin cannot rebind a Vendor account through the Data API'
);
select throws_ok(
  $$update public.vendor_companies
    set vendor_type = 'partner'
    where id = '83000000-0000-4000-8000-000000000003'$$,
  '42501',
  'Only a Superadmin or trusted server workflow can change Vendor authorization bindings',
  'Admin cannot change a Vendor subtype through the Data API'
);

insert into public.matches (
  id, admin_id, delegation_company_id, partner_company_id, status, score, note
) values (
  '84000000-0000-4000-8000-000000000001',
  '82000000-0000-4000-8000-000000000001',
  '83000000-0000-4000-8000-000000000001',
  '83000000-0000-4000-8000-000000000004',
  'Proposed', 90, 'Mutual acceptance RLS test'
);
select throws_ok(
  $$update public.matches
    set delegation_accepted_at = now()
    where id = '84000000-0000-4000-8000-000000000001'$$,
  '42501',
  'Admins cannot accept a match on behalf of a Vendor',
  'Admin cannot record a Vendor acceptance'
);
select throws_ok(
  $$update public.matches
    set status = 'Accepted'
    where id = '84000000-0000-4000-8000-000000000001'$$,
  '42501',
  'Use the Vendor decision or trusted meeting workflow to advance a match',
  'Admin cannot bypass the Vendor decision workflow'
);
update public.matches
set status = 'Rejected'
where id = '84000000-0000-4000-8000-000000000001';
select is(
  (
    select status
    from public.matches
    where id = '84000000-0000-4000-8000-000000000001'
  ),
  'Rejected'::text,
  'Admin can leave a match awaiting fresh Vendor acceptance'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000001","vendor_type":"delegation"}}';

select results_eq(
  $$select count(*) from public.match_participants()$$,
  array[1::bigint],
  'Disabled discovery preserves counterpart summaries for existing matches'
);
select results_eq(
  $$select count(*) from public.vendor_companies where id in (
    '83000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000002'
  )$$,
  array[1::bigint],
  'Vendor sees only its own company'
);
select is(
  (
    select id
    from public.vendor_companies
    where id = '83000000-0000-4000-8000-000000000002'
  ),
  null::uuid,
  'Vendor cannot read another Vendor'
);
select results_eq(
  $$select count(*) from public.vendor_applications$$,
  array[0::bigint],
  'Vendors cannot read application records'
);
update public.user_profiles
set
  role = 'superadmin',
  admin_id = null,
  vendor_company_id = null,
  vendor_type = null
where id = '81000000-0000-4000-8000-000000000004';
select is(
  (
    select role
    from public.user_profiles
    where id = '81000000-0000-4000-8000-000000000004'
  ),
  'vendor',
  'Vendor cannot promote itself through the profile table'
);

update public.matches
set
  status = 'Proposed',
  delegation_accepted_at = now()
where id = '84000000-0000-4000-8000-000000000001';
select results_eq(
  $$select status from public.matches
    where id = '84000000-0000-4000-8000-000000000001'$$,
  array['Proposed'::text],
  'One Vendor acceptance reopens a legacy Rejected match without accepting it'
);
select ok(
  (
    select delegation_accepted_at is not null
    from public.matches
    where id = '84000000-0000-4000-8000-000000000001'
  ),
  'The accepting Vendor decision persists while the other Vendor is pending'
);
select throws_ok(
  $$update public.matches
    set status = 'Rejected'
    where id = '84000000-0000-4000-8000-000000000001'$$,
  '42501',
  'Vendors cannot reject or request changes to a match',
  'Vendor cannot use the removed Request change workflow directly'
);
select lives_ok(
  $$update public.matches
    set delegation_accepted_at = null
    where id = '84000000-0000-4000-8000-000000000001'$$,
  'Vendor can unaccept before the other Vendor responds'
);
select results_eq(
  $$select status, delegation_accepted_at is null
    from public.matches
    where id = '84000000-0000-4000-8000-000000000001'$$,
  $$values ('Proposed'::text, true)$$,
  'Unaccept returns the one-sided match to its waiting state'
);
select throws_ok(
  $$update public.matches
    set partner_accepted_at = now()
    where id = '84000000-0000-4000-8000-000000000001'$$,
  '42501',
  'A Delegation cannot decide for the Partner',
  'Delegation cannot record the Partner decision'
);
select throws_ok(
  $$update public.matches
    set status = 'Accepted'
    where id = '84000000-0000-4000-8000-000000000001'$$,
  '42501',
  'Record a Delegation acceptance instead of changing match status directly',
  'Vendor cannot bypass mutual acceptance through status'
);

update public.matches
set delegation_accepted_at = now()
where id = '84000000-0000-4000-8000-000000000001';

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000006","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000004","vendor_type":"partner"}}';

update public.matches
set partner_accepted_at = now()
where id = '84000000-0000-4000-8000-000000000001';
select results_eq(
  $$select status from public.matches
    where id = '84000000-0000-4000-8000-000000000001'$$,
  array['Accepted'::text],
  'The second Vendor acceptance accepts the match'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000001","vendor_type":"delegation"}}';

select throws_ok(
  $$update public.matches
    set delegation_accepted_at = null
    where id = '84000000-0000-4000-8000-000000000001'$$,
  '42501',
  'Acceptance cannot be withdrawn after the other Vendor accepts',
  'Vendor cannot unaccept after the counterpart accepts'
);

select lives_ok(
  $$insert into public.meeting_proposals (
      id, match_id, starts_at, duration_minutes
    ) values (
      '87000000-0000-4000-8000-000000000001',
      '84000000-0000-4000-8000-000000000001',
      (
        date_trunc(
          'week',
          now() at time zone 'Asia/Kuala_Lumpur'
        ) + interval '7 days 9 hours'
      ) at time zone 'Asia/Kuala_Lumpur',
      60
    )$$,
  'The first Vendor can propose an Admin-open meeting time'
);
select results_eq(
  $$select
      status,
      requested_by_vendor_type,
      delegation_approved_by,
      delegation_approved_at is not null,
      partner_approved_at is null,
      meeting_id is null
    from public.meeting_proposals
    where id = '87000000-0000-4000-8000-000000000001'$$,
  $$values (
    'pending'::text,
    'delegation'::text,
    '81000000-0000-4000-8000-000000000004'::uuid,
    true,
    true,
    true
  )$$,
  'A proposal records only the proposing Vendor approval'
);
select results_eq(
  $$select count(*) from public.meetings
    where match_id = '84000000-0000-4000-8000-000000000001'$$,
  array[0::bigint],
  'One Vendor approval does not create a meeting'
);
select throws_ok(
  $$update public.meeting_proposals
    set
      partner_approved_at = now(),
      partner_approved_by = '81000000-0000-4000-8000-000000000004'
    where id = '87000000-0000-4000-8000-000000000001'$$,
  '42501',
  'A Delegation Vendor cannot approve for the Partner',
  'The proposing Vendor cannot provide the second approval'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000005","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000002","vendor_company_id":"83000000-0000-4000-8000-000000000002","vendor_type":"partner"}}';
select results_eq(
  $$select count(*) from public.meeting_proposals
    where id = '87000000-0000-4000-8000-000000000001'$$,
  array[0::bigint],
  'A foreign-tenant Vendor cannot read the meeting proposal'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000006","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000004","vendor_type":"partner"}}';
select results_eq(
  $$select count(*) from public.meeting_proposals
    where id = '87000000-0000-4000-8000-000000000001'$$,
  array[1::bigint],
  'The matched counterpart can read the pending proposal'
);
select lives_ok(
  $$update public.meeting_proposals
    set
      partner_approved_at = now(),
      partner_approved_by = '81000000-0000-4000-8000-000000000006'
    where id = '87000000-0000-4000-8000-000000000001'$$,
  'The matched counterpart can provide the second approval'
);
select results_eq(
  $$select
      proposal.status,
      proposal.partner_approved_by,
      proposal.partner_approved_at is not null,
      proposal.meeting_id is not null,
      meeting.platform,
      meeting.status
    from public.meeting_proposals proposal
    join public.meetings meeting on meeting.id = proposal.meeting_id
    where proposal.id = '87000000-0000-4000-8000-000000000001'$$,
  $$values (
    'approved'::text,
    '81000000-0000-4000-8000-000000000006'::uuid,
    true,
    true,
    'Pending'::text,
    'Scheduled'::text
  )$$,
  'The second approval atomically creates the scheduled meeting'
);
select results_eq(
  $$select count(*) from public.meetings
    where match_id = '84000000-0000-4000-8000-000000000001'
      and status = 'Scheduled'$$,
  array[1::bigint],
  'Mutual approval creates exactly one scheduled meeting'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000003","role":"authenticated","app_metadata":{"role":"admin","admin_id":"82000000-0000-4000-8000-000000000002"}}';
select results_eq(
  $$select count(*) from public.meeting_proposals
    where id = '87000000-0000-4000-8000-000000000001'$$,
  array[0::bigint],
  'A foreign Admin cannot read another tenant meeting proposal'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin","admin_id":"82000000-0000-4000-8000-000000000001"}}';
select results_eq(
  $$select count(*) from public.meeting_proposals
    where id = '87000000-0000-4000-8000-000000000001'$$,
  array[1::bigint],
  'The owning Admin can audit the Vendor meeting approval'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000001","vendor_type":"delegation"}}';
select throws_ok(
  $$select public.complete_meeting_with_mou(
    '85000000-0000-4000-8000-000000000002'
  )$$,
  '42501',
  'Only an active Admin can complete a meeting',
  'A Vendor cannot complete a meeting to unlock MOU signing'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin","admin_id":"82000000-0000-4000-8000-000000000001"}}';

insert into public.meetings (
  id, admin_id, match_id, starts_at, duration_minutes, platform, link,
  interpreter, host, status, summary
) values (
  '85000000-0000-4000-8000-000000000002',
  '82000000-0000-4000-8000-000000000001',
  '84000000-0000-4000-8000-000000000001',
  '2026-07-30T10:00:00+08:00',
  60,
  'Zoom',
  '/m/rls-mou-signing-session',
  'To be confirmed',
  'RLS Admin A',
  'Scheduled',
  'MOU signing test meeting'
);

select is(
  public.complete_meeting_with_mou(
    '85000000-0000-4000-8000-000000000002'
  ),
  true,
  'Completing a meeting creates its pending MOU atomically'
);
select results_eq(
  $$select status, signatory_check
    from public.deals
    where match_id = '84000000-0000-4000-8000-000000000001'$$,
  $$values ('Under Discussion'::text, 'Pending'::text)$$,
  'The automatic MOU starts pending with no inferred signatures'
);
select is(
  public.complete_meeting_with_mou(
    '85000000-0000-4000-8000-000000000002'
  ),
  true,
  'Completing the same meeting again is idempotent'
);
select results_eq(
  $$select count(*) from public.deals
    where match_id = '84000000-0000-4000-8000-000000000001'$$,
  array[1::bigint],
  'Repeated completion cannot create a duplicate MOU'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000001","vendor_type":"delegation"}}';

select throws_ok(
  $$select public.sign_vendor_mou(
    (
      select id from public.deals
      where match_id = '84000000-0000-4000-8000-000000000001'
    ),
    false
  )$$,
  '22023',
  'Confirm the MOU agreement before signing',
  'A Vendor must explicitly agree before signing'
);
select is(
  public.sign_vendor_mou(
    (
      select id from public.deals
      where match_id = '84000000-0000-4000-8000-000000000001'
    ),
    true
  ),
  'Agreement Reached'::text,
  'The first Vendor signature records agreement without claiming both parties'
);
select results_eq(
  $$select
      delegation_signed_by,
      delegation_signed_at is not null,
      partner_signed_at is null,
      status
    from public.deals
    where match_id = '84000000-0000-4000-8000-000000000001'$$,
  $$values (
    '81000000-0000-4000-8000-000000000004'::uuid,
    true,
    true,
    'Agreement Reached'::text
  )$$,
  'The first signature is attributed only to the signing Vendor account'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000006","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000004","vendor_type":"partner"}}';

select is(
  public.sign_vendor_mou(
    (
      select id from public.deals
      where match_id = '84000000-0000-4000-8000-000000000001'
    ),
    true
  ),
  'Signed'::text,
  'The second Vendor signature completes the MOU'
);
select results_eq(
  $$select
      partner_signed_by,
      partner_signed_at is not null,
      status,
      signatory_check
    from public.deals
    where match_id = '84000000-0000-4000-8000-000000000001'$$,
  $$values (
    '81000000-0000-4000-8000-000000000006'::uuid,
    true,
    'Signed'::text,
    'Verified'::text
  )$$,
  'Both Vendor signatures produce a verified Signed MOU'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000005","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000002","vendor_company_id":"83000000-0000-4000-8000-000000000002","vendor_type":"partner"}}';
select throws_ok(
  $$select public.sign_vendor_mou(
    (
      select id from public.deals
      where match_id = '84000000-0000-4000-8000-000000000001'
    ),
    true
  )$$,
  '42501',
  'MOU not found in the active Vendor tenant',
  'A foreign-tenant Vendor cannot sign the MOU'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin","admin_id":"82000000-0000-4000-8000-000000000001"}}';
select throws_ok(
  $$select public.sign_vendor_mou(
    (
      select id from public.deals
      where match_id = '84000000-0000-4000-8000-000000000001'
    ),
    true
  )$$,
  '42501',
  'Only an active Vendor can sign an MOU',
  'An Admin cannot sign on behalf of either Vendor'
);
select throws_ok(
  $$update public.deals
    set
      delegation_signed_at = null,
      delegation_signed_by = null,
      status = 'Agreement Reached'
    where match_id = '84000000-0000-4000-8000-000000000001'$$,
  '42501',
  'Vendor MOU signature evidence is append-only',
  'An Admin cannot clear or rewrite recorded Vendor signature evidence'
);
select throws_ok(
  $$select * from public.oauth_tokens$$,
  '42501',
  'permission denied for table oauth_tokens',
  'Authenticated users cannot read the Lark token store'
);
select throws_ok(
  $$select * from public.meeting_provider_links$$,
  '42501',
  'permission denied for table meeting_provider_links',
  'Authenticated users cannot read raw provider URLs'
);

update public.matches
set
  status = 'Proposed',
  delegation_accepted_at = null,
  partner_accepted_at = null
where id = '84000000-0000-4000-8000-000000000001';

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000001","vendor_type":"delegation"}}';

update public.matches
set delegation_accepted_at = now()
where id = '84000000-0000-4000-8000-000000000001';

select throws_ok(
  $$update public.matches
    set delegation_accepted_at = null
    where id = '84000000-0000-4000-8000-000000000001'$$,
  '42501',
  'Acceptance cannot be withdrawn after a meeting is arranged',
  'Vendor cannot unaccept after a meeting exists'
);

reset role;
insert into public.meeting_creation_jobs (
  id, match_id, admin_id, provider, status, attempt_count,
  failure_code, failure_summary
) values (
  '85000000-0000-4000-8000-000000000001',
  '84000000-0000-4000-8000-000000000001',
  '82000000-0000-4000-8000-000000000001',
  'zoom', 'failed', 1, 'provider_error',
  'The meeting provider rejected or returned an invalid meeting.'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000006","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000004","vendor_type":"partner"}}';
select results_eq(
  $$select count(*) from public.meeting_creation_jobs$$,
  array[0::bigint],
  'Vendors cannot read critical meeting incidents'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin","admin_id":"82000000-0000-4000-8000-000000000001"}}';
select results_eq(
  $$select count(*) from public.meeting_creation_jobs$$,
  array[0::bigint],
  'Admins cannot read critical meeting incidents'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin"}}';
select results_eq(
  $$select count(*) from public.admin_tenants where id =
    '82000000-0000-4000-8000-000000000001'$$,
  array[0::bigint],
  'Malformed Admin claims fail closed'
);

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"superadmin"}}';

select results_eq(
  $$select count(*) from public.admin_tenants where id in (
    '82000000-0000-4000-8000-000000000001',
    '82000000-0000-4000-8000-000000000002'
  )$$,
  array[2::bigint],
  'Superadmin sees every tenant'
);
select results_eq(
  $$select count(*) from public.vendor_companies where id in (
    '83000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000002'
  )$$,
  array[2::bigint],
  'Superadmin sees every Vendor'
);
select results_eq(
  $$select count(*) from public.vendor_applications where id in (
    '86000000-0000-4000-8000-000000000001',
    '86000000-0000-4000-8000-000000000002'
  )$$,
  array[2::bigint],
  'Superadmin has governance visibility across Vendor applications'
);
select results_eq(
  $$select count(*) from public.meeting_creation_jobs
    where id = '85000000-0000-4000-8000-000000000001'$$,
  array[1::bigint],
  'Superadmin sees sanitized critical meeting incidents'
);
select throws_ok(
  $$insert into public.meeting_creation_jobs (
    match_id, admin_id, provider
  ) values (
    '84000000-0000-4000-8000-000000000001',
    '82000000-0000-4000-8000-000000000001',
    'zoom'
  )$$,
  '42501',
  'permission denied for table meeting_creation_jobs',
  'Superadmin cannot forge service-controlled meeting incidents'
);

delete from public.matches
where id = '84000000-0000-4000-8000-000000000001';

select lives_ok(
  $$select public.transfer_vendor(
    '83000000-0000-4000-8000-000000000001',
    '82000000-0000-4000-8000-000000000002'
  )$$,
  'Superadmin can run an audited Vendor transfer'
);
select results_eq(
  $$select count(*) from public.audit_events
    where target_table = 'vendor_companies'
      and target_id = '83000000-0000-4000-8000-000000000001'
      and action = 'update'
      and actor_user_id = '81000000-0000-4000-8000-000000000001'$$,
  array[1::bigint],
  'Vendor transfer produces an actor-attributed audit event'
);
select throws_ok(
  $$delete from public.audit_events$$,
  '42501',
  'permission denied for table audit_events',
  'Audit history is append-only to application roles'
);

reset role;
update public.user_profiles
set active = false
where id = '81000000-0000-4000-8000-000000000005';

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000005","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000002","vendor_company_id":"83000000-0000-4000-8000-000000000002","vendor_type":"partner"}}';

select results_eq(
  $$select count(*) from public.vendor_companies where id =
    '83000000-0000-4000-8000-000000000002'$$,
  array[0::bigint],
  'Suspended account fails closed even with a stale JWT'
);

reset role;
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '81000000-0000-4000-8000-000000000007',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'application-b@example.invalid',
  '',
  now(),
  '{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000002","vendor_company_id":"83000000-0000-4000-8000-000000000005","vendor_type":"partner"}',
  '{"display_name":"Application B"}',
  now(),
  now()
);

insert into public.partner_companies (
  id, admin_id, vendor_company_id, vendor_type,
  name_en, name_cn, sector, partner_type, company_size, offerings,
  contact, contact_meta, status, profile_complete, verified, attendance, arrived,
  profile_data
) values (
  '83000000-0000-4000-8000-000000000005',
  '82000000-0000-4000-8000-000000000002',
  '83000000-0000-4000-8000-000000000005',
  'partner',
  'Application Vendor B',
  '',
  'Testing',
  'Enterprise',
  'Test',
  'Testing',
  'Application B',
  'application-b@example.invalid',
  'Confirmed',
  100,
  'Verified',
  'Invited',
  false,
  '{"companyNameEn":"Application Vendor B"}'
);

insert into public.user_profiles (
  id, role, display_name, email, admin_id, vendor_company_id, vendor_type, active
) values (
  '81000000-0000-4000-8000-000000000007',
  'vendor',
  'Application B',
  'application-b@example.invalid',
  '82000000-0000-4000-8000-000000000002',
  '83000000-0000-4000-8000-000000000005',
  'partner',
  true
);

update public.vendor_applications
set
  status = 'provisioning',
  reviewed_by = '81000000-0000-4000-8000-000000000003',
  reviewed_at = now()
where id = '86000000-0000-4000-8000-000000000002';

select is(
  public.finalize_vendor_application_approval(
    '86000000-0000-4000-8000-000000000002',
    '82000000-0000-4000-8000-000000000002',
    '81000000-0000-4000-8000-000000000003',
    '83000000-0000-4000-8000-000000000005',
    '81000000-0000-4000-8000-000000000007'
  ),
  true,
  'Trusted workflow finalizes one claimed Vendor application'
);
select results_eq(
  $$select status, vendor_company_id, auth_user_id
    from public.vendor_applications
    where id = '86000000-0000-4000-8000-000000000002'$$,
  $$values (
    'approved'::text,
    '83000000-0000-4000-8000-000000000005'::uuid,
    '81000000-0000-4000-8000-000000000007'::uuid
  )$$,
  'Finalized application stores the resulting trusted IDs'
);
select results_eq(
  $$select count(*) from public.audit_events
    where action = 'approve_vendor_application'
      and target_id = '86000000-0000-4000-8000-000000000002'
      and actor_user_id = '81000000-0000-4000-8000-000000000003'$$,
  array[1::bigint],
  'Approval finalization writes actor-attributed audit evidence atomically'
);
select is(
  public.finalize_vendor_application_approval(
    '86000000-0000-4000-8000-000000000002',
    '82000000-0000-4000-8000-000000000002',
    '81000000-0000-4000-8000-000000000003',
    '83000000-0000-4000-8000-000000000005',
    '81000000-0000-4000-8000-000000000007'
  ),
  false,
  'A second finalization cannot approve the same application twice'
);

update public.user_profiles
set active = false
where id = '81000000-0000-4000-8000-000000000003';

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000003","role":"authenticated","app_metadata":{"role":"admin","admin_id":"82000000-0000-4000-8000-000000000002"}}';
select results_eq(
  $$select count(*) from public.vendor_applications$$,
  array[0::bigint],
  'Inactive Admin cannot read Vendor applications with a stale JWT'
);

select * from finish();
rollback;
