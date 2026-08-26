begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

insert into public.admin_tenants (id, slug, name)
values (
  'a2000000-0000-4000-8000-000000000001',
  'tchina-access-test',
  'TChina access test tenant'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    'a1000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'tchina-super@example.invalid', '',
    now(), '{"role":"superadmin"}', '{}', now(), now()
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'tchina-admin@example.invalid', '',
    now(),
    '{"role":"admin","admin_id":"a2000000-0000-4000-8000-000000000001"}',
    '{}', now(), now()
  );

insert into public.user_profiles (
  id, role, display_name, email, admin_id, active
) values
  (
    'a1000000-0000-4000-8000-000000000001', 'superadmin',
    'TChina Superadmin', 'tchina-super@example.invalid', null, true
  ),
  (
    'a1000000-0000-4000-8000-000000000002', 'admin',
    'TChina Admin', 'tchina-admin@example.invalid',
    'a2000000-0000-4000-8000-000000000001', true
  );

update public.tchina_events
set
  venue_name = 'Test venue',
  venue_address = 'Test Guangzhou address',
  organizer_name = 'Plexus test organizer',
  support_email = 'support@example.invalid'
where singleton_key = 'plexus';

insert into public.event_registrations (
  id, event_id, reference_code, attendee_type,
  normalized_email, full_name, mobile_number, country_region,
  preferred_language, attendance_dates, answers, consented_at
) values (
  'a4000000-0000-4000-8000-000000000001',
  (select id from public.tchina_events where singleton_key = 'plexus'),
  'TC26-20260826-AAAAAA', 'general_visitor',
  'visitor@example.invalid', 'Visitor A', '+60123456789', 'Malaysia',
  'en', array[date '2026-08-31'],
  '{"industryInterests":["Technology"],"visitPurpose":"Visit"}', now()
);

select results_eq(
  $$select count(*) from public.tchina_events where singleton_key = 'plexus'$$,
  array[1::bigint],
  'Exactly one Plexus TChina event exists'
);

set local role anon;
select throws_ok(
  $$select * from public.tchina_events$$,
  '42501', 'permission denied for table tchina_events',
  'Anonymous users cannot read event configuration'
);
select throws_ok(
  $$insert into public.event_registrations (
    event_id, reference_code, attendee_type, normalized_email,
    full_name, mobile_number, country_region, preferred_language,
    attendance_dates, answers, consented_at
  ) values (
    (select id from public.tchina_events where singleton_key = 'plexus'),
    'TC26-20260826-BBBBBB', 'general_visitor',
    'anonymous@example.invalid', 'Anonymous', '+60123456789', 'Malaysia',
    'en', array[date '2026-08-31'], '{}', now()
  )$$,
  '42501', 'permission denied for table event_registrations',
  'Anonymous users cannot submit through the Data API'
);

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"a1000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin","admin_id":"a2000000-0000-4000-8000-000000000001"}}';
select results_eq(
  $$select count(*) from public.tchina_events$$,
  array[0::bigint],
  'Normal Admins cannot see the Plexus event'
);
select results_eq(
  $$select count(*) from public.event_registrations$$,
  array[0::bigint],
  'Normal Admins cannot see Plexus registrations'
);
select throws_ok(
  $$update public.event_registrations set status = 'rejected'$$,
  '42501', 'permission denied for table event_registrations',
  'Normal Admin browser sessions cannot change review state'
);

set local request.jwt.claims =
  '{"sub":"a1000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"superadmin"}}';
select results_eq(
  $$select count(*) from public.tchina_events$$,
  array[1::bigint],
  'Active Superadmin sees the Plexus event'
);
select results_eq(
  $$select count(*) from public.event_registrations$$,
  array[1::bigint],
  'Active Superadmin sees Plexus registrations'
);

set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select throws_ok(
  $$insert into public.tchina_events (singleton_key) values ('plexus')$$,
  '23505',
  'duplicate key value violates unique constraint "tchina_events_singleton_key_key"',
  'A second Plexus TChina event cannot be created'
);
select throws_ok(
  $$insert into public.event_registrations (
    event_id, reference_code, attendee_type, normalized_email,
    full_name, mobile_number, country_region, preferred_language,
    attendance_dates, answers, consented_at
  ) values (
    (select id from public.tchina_events where singleton_key = 'plexus'),
    'TC26-20260826-CCCCCC', 'general_visitor',
    'visitor@example.invalid', 'Duplicate A', '+60123456780', 'Malaysia',
    'en', array[date '2026-08-31'], '{}', now()
  )$$,
  '23505',
  'duplicate key value violates unique constraint "event_registrations_non_rejected_email_idx"',
  'One non-rejected registration is allowed per normalized email'
);
select throws_ok(
  $$update public.event_registrations
    set answers = '{"changed":true}'
    where id = 'a4000000-0000-4000-8000-000000000001'$$,
  'P0001', 'Submitted event registration identity and answers are immutable',
  'Submitted questionnaire answers are immutable'
);
select throws_ok(
  $$update public.event_registrations
    set status = 'provisioning'
    where id = 'a4000000-0000-4000-8000-000000000001';
    update public.event_registrations
    set status = 'rejected',
        reviewed_by = 'a1000000-0000-4000-8000-000000000001',
        reviewed_at = now()
    where id = 'a4000000-0000-4000-8000-000000000001'$$,
  'P0001', 'Invalid event registration status transition',
  'Provisioning cannot transition directly to rejected'
);
select lives_ok(
  $$update public.event_registrations
    set status = 'rejected',
        reviewed_by = 'a1000000-0000-4000-8000-000000000001',
        reviewed_at = now()
    where id = 'a4000000-0000-4000-8000-000000000001';
    insert into public.event_registrations (
      event_id, reference_code, attendee_type, normalized_email,
      full_name, mobile_number, country_region, preferred_language,
      attendance_dates, answers, consented_at
    ) values (
      (select id from public.tchina_events where singleton_key = 'plexus'),
      'TC26-20260826-DDDDDD', 'general_visitor',
      'visitor@example.invalid', 'Visitor resubmission', '+60123456781',
      'Malaysia', 'en', array[date '2026-08-31'], '{}', now()
    )$$,
  'A rejected attendee may submit again'
);

select * from finish();
rollback;
