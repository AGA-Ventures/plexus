begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into public.admin_tenants (id, slug, name)
values (
  '92000000-0000-4000-8000-000000000001',
  'email-ledger-test',
  'Email Ledger Test'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    '91000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'email-super@example.invalid', '',
    now(), '{"role":"superadmin"}', '{}', now(), now()
  ),
  (
    '91000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'email-admin@example.invalid', '',
    now(),
    '{"role":"admin","admin_id":"92000000-0000-4000-8000-000000000001"}',
    '{}', now(), now()
  ),
  (
    '91000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'email-vendor@example.invalid', '',
    now(),
    '{"role":"vendor","admin_id":"92000000-0000-4000-8000-000000000001","vendor_company_id":"93000000-0000-4000-8000-000000000001","vendor_type":"delegation"}',
    '{}', now(), now()
  );

insert into public.vendor_companies (
  id, admin_id, vendor_type, name_en, sector
) values (
  '93000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000001',
  'delegation',
  'Email Vendor',
  'Testing'
);

insert into public.user_profiles (
  id, role, display_name, email, admin_id, vendor_company_id, vendor_type, active
) values
  (
    '91000000-0000-4000-8000-000000000001',
    'superadmin', 'Email Superadmin', 'email-super@example.invalid',
    null, null, null, true
  ),
  (
    '91000000-0000-4000-8000-000000000002',
    'admin', 'Email Admin', 'email-admin@example.invalid',
    '92000000-0000-4000-8000-000000000001', null, null, true
  ),
  (
    '91000000-0000-4000-8000-000000000003',
    'vendor', 'Email Vendor', 'email-vendor@example.invalid',
    '92000000-0000-4000-8000-000000000001',
    '93000000-0000-4000-8000-000000000001', 'delegation', true
  );

insert into public.email_deliveries (
  id,
  admin_id,
  sender_type,
  sender_user_id,
  sender_name,
  from_address,
  recipient_email,
  recipient_role,
  trigger_key,
  subject,
  provider,
  provider_message_id,
  status,
  idempotency_key
) values (
  '94000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000001',
  'admin',
  '91000000-0000-4000-8000-000000000002',
  'Email Admin',
  'Plexus <notifications@example.invalid>',
  'email-vendor@example.invalid',
  'vendor',
  'information_blast',
  'Email ledger test',
  'resend',
  'provider-email-ledger-test',
  'delivered',
  'plexus/information_blast/email-ledger-test'
);

insert into public.email_delivery_events (
  delivery_id,
  provider_event_id,
  event_type,
  occurred_at
) values (
  '94000000-0000-4000-8000-000000000001',
  'event-email-ledger-test',
  'email.delivered',
  now()
);

set local role anon;
select throws_ok(
  $$select * from public.email_deliveries$$,
  '42501',
  'permission denied for table email_deliveries',
  'Anonymous users cannot read the delivery ledger'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin","admin_id":"92000000-0000-4000-8000-000000000001"}}';
select results_eq(
  $$select count(*) from public.email_deliveries$$,
  array[0::bigint],
  'Tenant Admin cannot read the Superadmin delivery ledger'
);
select throws_ok(
  $$insert into public.email_deliveries (
      admin_id, sender_type, sender_name, recipient_email, trigger_key,
      subject, provider, status, idempotency_key
    ) values (
      '92000000-0000-4000-8000-000000000001',
      'admin',
      'Email Admin',
      'email-vendor@example.invalid',
      'information_blast',
      'Unauthorized insert',
      'resend',
      'queued',
      'unauthorized-insert'
    )$$,
  '42501',
  'permission denied for table email_deliveries',
  'Tenant Admin cannot forge delivery records'
);

set local request.jwt.claims =
  '{"sub":"91000000-0000-4000-8000-000000000003","role":"authenticated","app_metadata":{"role":"vendor","admin_id":"92000000-0000-4000-8000-000000000001","vendor_company_id":"93000000-0000-4000-8000-000000000001","vendor_type":"delegation"}}';
select results_eq(
  $$select count(*) from public.email_deliveries$$,
  array[0::bigint],
  'Vendor cannot read the Superadmin delivery ledger'
);

set local request.jwt.claims =
  '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"superadmin"}}';
select results_eq(
  $$select count(*) from public.email_deliveries
    where id = '94000000-0000-4000-8000-000000000001'$$,
  array[1::bigint],
  'Active Superadmin can read delivery records across tenants'
);
select results_eq(
  $$select count(*) from public.email_delivery_events
    where delivery_id = '94000000-0000-4000-8000-000000000001'$$,
  array[1::bigint],
  'Active Superadmin can read provider lifecycle events'
);
select throws_ok(
  $$update public.email_deliveries
    set status = 'failed'
    where id = '94000000-0000-4000-8000-000000000001'$$,
  '42501',
  'permission denied for table email_deliveries',
  'Superadmin UI access cannot alter provider-owned delivery state'
);

select * from finish();
rollback;
