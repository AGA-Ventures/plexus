begin;

create extension if not exists pgtap with schema extensions;
select plan(28);

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

set local request.jwt.claims =
  '{"sub":"81000000-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"82000000-0000-4000-8000-000000000001","vendor_company_id":"83000000-0000-4000-8000-000000000001","vendor_type":"delegation"}}';

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
set delegation_accepted_at = now()
where id = '84000000-0000-4000-8000-000000000001';
select results_eq(
  $$select status from public.matches
    where id = '84000000-0000-4000-8000-000000000001'$$,
  array['Proposed'::text],
  'One Vendor acceptance does not accept the match'
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
  'Record a Delegation decision instead of changing match status directly',
  'Vendor cannot bypass mutual acceptance through status'
);

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

select * from finish();
rollback;
