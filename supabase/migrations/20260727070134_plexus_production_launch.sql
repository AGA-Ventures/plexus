create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
set search_path = ''
as $$
  select auth.jwt() -> 'app_metadata' ->> 'role'
$$;

create or replace function public.current_delegation_company_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'delegation_company_id', '')::uuid
$$;

create or replace function public.current_partner_company_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'partner_company_id', '')::uuid
$$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'delegation', 'partner')),
  delegation_company_id uuid,
  partner_company_id uuid,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (role = 'admin' and delegation_company_id is null and partner_company_id is null)
    or (role = 'delegation' and delegation_company_id is not null and partner_company_id is null)
    or (role = 'partner' and delegation_company_id is null and partner_company_id is not null)
  )
);

create table if not exists public.delegation_companies (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_cn text not null,
  sector text not null,
  origin text not null,
  company_size text not null,
  needs text not null,
  contact text not null,
  contact_meta text not null,
  status text not null check (status in ('Onboarded', 'Invited', 'Incomplete', 'Locked')),
  profile_complete integer not null default 0 check (profile_complete between 0 and 100),
  urgent boolean not null default false,
  coordinator text not null,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_companies (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_cn text not null,
  sector text not null,
  partner_type text not null check (partner_type in ('Government', 'Association', 'Enterprise')),
  company_size text not null,
  offerings text not null,
  contact text not null,
  contact_meta text not null,
  status text not null check (status in ('Sourced', 'Invited', 'Confirmed', 'Declined')),
  profile_complete integer not null default 0 check (profile_complete between 0 and 100),
  verified text not null check (verified in ('Verified', 'Pending', 'Flagged')),
  attendance text not null check (attendance in ('Invited', 'Confirmed', 'Declined', 'Arrived')),
  arrived boolean not null default false,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_profiles_delegation_company_id_fkey'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_delegation_company_id_fkey
      foreign key (delegation_company_id) references public.delegation_companies(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_profiles_partner_company_id_fkey'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_partner_company_id_fkey
      foreign key (partner_company_id) references public.partner_companies(id) on delete set null;
  end if;
end $$;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  delegation_company_id uuid not null references public.delegation_companies(id) on delete cascade,
  partner_company_id uuid not null references public.partner_companies(id) on delete cascade,
  status text not null check (status in ('Proposed', 'Accepted', 'Rejected', 'Session Scheduled')),
  score integer not null check (score between 0 and 100),
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (delegation_company_id, partner_company_id)
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  starts_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  platform text not null check (platform in ('Zoom', 'VooV')),
  link text not null,
  interpreter text not null,
  host text not null,
  status text not null check (status in ('Scheduled', 'Live', 'Completed', 'Cancelled')),
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  status text not null check (status in ('Under Discussion', 'Agreement Reached', 'Signed', 'Failed')),
  document text not null,
  signatory_check text not null check (signatory_check in ('Verified', 'Pending', 'Flagged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.itinerary_slots (
  id uuid primary key default gen_random_uuid(),
  day_label text not null,
  start_time text not null,
  activity text not null,
  venue text not null,
  escort text not null,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  venue text not null,
  visit_date date not null,
  start_time text not null,
  driver text not null,
  escort text not null,
  status text not null check (status in ('Planned', 'Confirmed', 'Completed')),
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_visit_delegations (
  site_visit_id uuid not null references public.site_visits(id) on delete cascade,
  delegation_company_id uuid not null references public.delegation_companies(id) on delete cascade,
  primary key (site_visit_id, delegation_company_id)
);

create table if not exists public.liaison_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  organisation text not null,
  status text not null check (status in ('Draft', 'Confirmed', 'Briefed')),
  protocol text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz not null default now()
);

create or replace trigger touch_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.touch_updated_at();
create or replace trigger touch_delegation_companies_updated_at
  before update on public.delegation_companies
  for each row execute function public.touch_updated_at();
create or replace trigger touch_partner_companies_updated_at
  before update on public.partner_companies
  for each row execute function public.touch_updated_at();
create or replace trigger touch_matches_updated_at
  before update on public.matches
  for each row execute function public.touch_updated_at();
create or replace trigger touch_meetings_updated_at
  before update on public.meetings
  for each row execute function public.touch_updated_at();
create or replace trigger touch_deals_updated_at
  before update on public.deals
  for each row execute function public.touch_updated_at();
create or replace trigger touch_itinerary_slots_updated_at
  before update on public.itinerary_slots
  for each row execute function public.touch_updated_at();
create or replace trigger touch_site_visits_updated_at
  before update on public.site_visits
  for each row execute function public.touch_updated_at();
create or replace trigger touch_liaison_contacts_updated_at
  before update on public.liaison_contacts
  for each row execute function public.touch_updated_at();

create index if not exists user_profiles_role_idx on public.user_profiles(role);
create index if not exists user_profiles_delegation_company_id_idx
  on public.user_profiles(delegation_company_id);
create index if not exists user_profiles_partner_company_id_idx
  on public.user_profiles(partner_company_id);
create index if not exists matches_delegation_company_id_idx on public.matches(delegation_company_id);
create index if not exists matches_partner_company_id_idx on public.matches(partner_company_id);
create index if not exists meetings_match_id_idx on public.meetings(match_id);
create index if not exists deals_match_id_idx on public.deals(match_id);
create index if not exists site_visit_delegations_delegation_company_id_idx
  on public.site_visit_delegations(delegation_company_id);

alter table public.user_profiles enable row level security;
alter table public.delegation_companies enable row level security;
alter table public.partner_companies enable row level security;
alter table public.matches enable row level security;
alter table public.meetings enable row level security;
alter table public.deals enable row level security;
alter table public.itinerary_slots enable row level security;
alter table public.site_visits enable row level security;
alter table public.site_visit_delegations enable row level security;
alter table public.liaison_contacts enable row level security;
alter table public.notifications enable row level security;

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

create policy "admin manages user profiles"
  on public.user_profiles for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "users read own profile"
  on public.user_profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "admin manages delegation companies"
  on public.delegation_companies for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "delegation reads own company"
  on public.delegation_companies for select to authenticated
  using (public.current_app_role() = 'delegation' and id = public.current_delegation_company_id());
create policy "delegation updates own company"
  on public.delegation_companies for update to authenticated
  using (public.current_app_role() = 'delegation' and id = public.current_delegation_company_id())
  with check (public.current_app_role() = 'delegation' and id = public.current_delegation_company_id());

create policy "admin manages partner companies"
  on public.partner_companies for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "partner reads own company"
  on public.partner_companies for select to authenticated
  using (public.current_app_role() = 'partner' and id = public.current_partner_company_id());
create policy "partner updates own company"
  on public.partner_companies for update to authenticated
  using (public.current_app_role() = 'partner' and id = public.current_partner_company_id())
  with check (public.current_app_role() = 'partner' and id = public.current_partner_company_id());

create policy "admin manages matches"
  on public.matches for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "delegation reads related matches"
  on public.matches for select to authenticated
  using (public.current_app_role() = 'delegation' and delegation_company_id = public.current_delegation_company_id());
create policy "delegation updates related match status"
  on public.matches for update to authenticated
  using (public.current_app_role() = 'delegation' and delegation_company_id = public.current_delegation_company_id())
  with check (public.current_app_role() = 'delegation' and delegation_company_id = public.current_delegation_company_id());
create policy "partner reads related matches"
  on public.matches for select to authenticated
  using (public.current_app_role() = 'partner' and partner_company_id = public.current_partner_company_id());
create policy "partner updates related match status"
  on public.matches for update to authenticated
  using (public.current_app_role() = 'partner' and partner_company_id = public.current_partner_company_id())
  with check (public.current_app_role() = 'partner' and partner_company_id = public.current_partner_company_id());

create policy "admin manages meetings"
  on public.meetings for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "delegation reads related meetings"
  on public.meetings for select to authenticated
  using (
    public.current_app_role() = 'delegation'
    and exists (
      select 1 from public.matches
      where matches.id = meetings.match_id
      and matches.delegation_company_id = public.current_delegation_company_id()
    )
  );
create policy "partner reads related meetings"
  on public.meetings for select to authenticated
  using (
    public.current_app_role() = 'partner'
    and exists (
      select 1 from public.matches
      where matches.id = meetings.match_id
      and matches.partner_company_id = public.current_partner_company_id()
    )
  );

create policy "admin manages deals"
  on public.deals for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "delegation reads related deals"
  on public.deals for select to authenticated
  using (
    public.current_app_role() = 'delegation'
    and exists (
      select 1 from public.matches
      where matches.id = deals.match_id
      and matches.delegation_company_id = public.current_delegation_company_id()
    )
  );
create policy "partner reads related deals"
  on public.deals for select to authenticated
  using (
    public.current_app_role() = 'partner'
    and exists (
      select 1 from public.matches
      where matches.id = deals.match_id
      and matches.partner_company_id = public.current_partner_company_id()
    )
  );

create policy "authenticated users read itinerary"
  on public.itinerary_slots for select to authenticated
  using (true);
create policy "admin manages itinerary"
  on public.itinerary_slots for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "admin manages site visits"
  on public.site_visits for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "delegation reads related site visits"
  on public.site_visits for select to authenticated
  using (
    public.current_app_role() = 'delegation'
    and exists (
      select 1 from public.site_visit_delegations
      where site_visit_delegations.site_visit_id = site_visits.id
      and site_visit_delegations.delegation_company_id = public.current_delegation_company_id()
    )
  );

create policy "admin manages site visit delegations"
  on public.site_visit_delegations for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "delegation reads own site visit delegations"
  on public.site_visit_delegations for select to authenticated
  using (
    public.current_app_role() = 'delegation'
    and delegation_company_id = public.current_delegation_company_id()
  );

create policy "authenticated users read liaison contacts"
  on public.liaison_contacts for select to authenticated
  using (true);
create policy "admin manages liaison contacts"
  on public.liaison_contacts for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "authenticated users read notifications"
  on public.notifications for select to authenticated
  using (true);
create policy "admin manages notifications"
  on public.notifications for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

revoke all on public.user_profiles from anon;
revoke all on public.delegation_companies from anon;
revoke all on public.partner_companies from anon;
revoke all on public.matches from anon;
revoke all on public.meetings from anon;
revoke all on public.deals from anon;
revoke all on public.itinerary_slots from anon;
revoke all on public.site_visits from anon;
revoke all on public.site_visit_delegations from anon;
revoke all on public.liaison_contacts from anon;
revoke all on public.notifications from anon;

revoke all on public.user_profiles from authenticated;
revoke all on public.delegation_companies from authenticated;
revoke all on public.partner_companies from authenticated;
revoke all on public.matches from authenticated;
revoke all on public.meetings from authenticated;
revoke all on public.deals from authenticated;
revoke all on public.itinerary_slots from authenticated;
revoke all on public.site_visits from authenticated;
revoke all on public.site_visit_delegations from authenticated;
revoke all on public.liaison_contacts from authenticated;
revoke all on public.notifications from authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.user_profiles to authenticated;
grant select, insert, update, delete on public.delegation_companies to authenticated;
grant select, insert, update, delete on public.partner_companies to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, update, delete on public.meetings to authenticated;
grant select, insert, update, delete on public.deals to authenticated;
grant select, insert, update, delete on public.itinerary_slots to authenticated;
grant select, insert, update, delete on public.site_visits to authenticated;
grant select, insert, update, delete on public.site_visit_delegations to authenticated;
grant select, insert, update, delete on public.liaison_contacts to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;

grant execute on function public.current_app_role() to authenticated;
grant execute on function public.current_delegation_company_id() to authenticated;
grant execute on function public.current_partner_company_id() to authenticated;

insert into public.delegation_companies
  (id, name_en, name_cn, sector, origin, company_size, needs, contact, contact_meta, status, profile_complete, urgent, coordinator)
values
  ('00000000-0000-4000-8000-000000000001', 'Hengqin Smart Mobility Group', '横琴智慧出行集团', 'Smart Mobility', 'Hengqin', '120 employees', 'Seeking Malaysian EV charging operators, fleet partners and local assembly routes.', 'Li Wen', 'CEO · liwen@example.cn · WeChat liwen-hq', 'Onboarded', 92, false, 'Sarah Lim'),
  ('00000000-0000-4000-8000-000000000002', 'Macao HealthTech Alliance', '澳门健康科技联盟', 'HealthTech', 'Macao', 'Association', 'Looking for hospital pilots, wellness distributors and regulatory briefing support.', 'Chan Mei', 'Programme Lead · chanmei@example.mo · WhatsApp +853 6000 1000', 'Invited', 68, true, 'Amir Rahman'),
  ('00000000-0000-4000-8000-000000000003', 'Guangdong AgriCloud Co.', '广东农云科技有限公司', 'AgriTech', 'Guangdong', '260 employees', 'Needs plantation groups and agri associations for traceability and IoT deployment.', 'Zhao Jun', 'BD Director · zhao@example.cn · WeChat agri-zhao', 'Locked', 100, false, 'Sarah Lim')
on conflict (id) do update set
  name_en = excluded.name_en,
  name_cn = excluded.name_cn,
  sector = excluded.sector,
  origin = excluded.origin,
  company_size = excluded.company_size,
  needs = excluded.needs,
  contact = excluded.contact,
  contact_meta = excluded.contact_meta,
  status = excluded.status,
  profile_complete = excluded.profile_complete,
  urgent = excluded.urgent,
  coordinator = excluded.coordinator;

insert into public.partner_companies
  (id, name_en, name_cn, sector, partner_type, company_size, offerings, contact, contact_meta, status, profile_complete, verified, attendance, arrived)
values
  ('00000000-0000-4000-8000-000000001001', 'Selangor EV Infrastructure Sdn Bhd', '雪兰莪电动车基础设施有限公司', 'Smart Mobility', 'Enterprise', '85 employees', 'Charging operations, municipal EV rollout and maintenance teams.', 'Nur Aisyah', 'Partnerships · aisyah@example.my · +60 12 200 2000', 'Confirmed', 96, 'Verified', 'Confirmed', false),
  ('00000000-0000-4000-8000-000000001002', 'Malaysia Digital Health Association', '马来西亚数字健康协会', 'HealthTech', 'Association', '140 members', 'Hospital network introductions, regulatory roundtables and pilot matching.', 'Dr. Kavitha Menon', 'Secretary · kavitha@example.my · +60 13 300 3000', 'Invited', 78, 'Pending', 'Invited', false),
  ('00000000-0000-4000-8000-000000001003', 'Penang Precision Manufacturing Council', '槟城精密制造理事会', 'Advanced Manufacturing', 'Association', '72 members', 'Factory visits, contract manufacturing references and engineering suppliers.', 'Jason Teoh', 'Council Manager · jason@example.my · +60 16 400 4000', 'Sourced', 64, 'Pending', 'Invited', false),
  ('00000000-0000-4000-8000-000000001004', 'Johor Agro Innovation Hub', '柔佛农业创新中心', 'AgriTech', 'Government', 'State-backed hub', 'Pilot farms, grants facilitation and agri exporter introductions.', 'Farid Ismail', 'Director · farid@example.my · +60 17 500 5000', 'Confirmed', 88, 'Verified', 'Confirmed', true)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_cn = excluded.name_cn,
  sector = excluded.sector,
  partner_type = excluded.partner_type,
  company_size = excluded.company_size,
  offerings = excluded.offerings,
  contact = excluded.contact,
  contact_meta = excluded.contact_meta,
  status = excluded.status,
  profile_complete = excluded.profile_complete,
  verified = excluded.verified,
  attendance = excluded.attendance,
  arrived = excluded.arrived;

insert into public.matches
  (id, delegation_company_id, partner_company_id, status, score, note)
values
  ('00000000-0000-4000-8000-000000002001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000001001', 'Session Scheduled', 94, 'Strong sector fit and Malaysia rollout experience.'),
  ('00000000-0000-4000-8000-000000002002', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000001003', 'Proposed', 72, 'Useful for assembly and maintenance partner discovery.'),
  ('00000000-0000-4000-8000-000000002003', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000001002', 'Accepted', 91, 'Association can coordinate hospital pilot conversations.'),
  ('00000000-0000-4000-8000-000000002004', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000001004', 'Session Scheduled', 96, 'Pilot farms and government liaison are aligned.')
on conflict (id) do update set
  delegation_company_id = excluded.delegation_company_id,
  partner_company_id = excluded.partner_company_id,
  status = excluded.status,
  score = excluded.score,
  note = excluded.note;

insert into public.meetings
  (id, match_id, starts_at, duration_minutes, platform, link, interpreter, host, status, summary)
values
  ('00000000-0000-4000-8000-000000003001', '00000000-0000-4000-8000-000000002001', '2026-07-08T10:00:00+08:00', 45, 'VooV', 'https://meeting.tencent.com/dm/local-demo-ses-1', 'Grace Wong · EN-ZH', 'Sarah Lim', 'Scheduled', 'Prep focus: regulatory approvals, pilot geography and charger uptime.'),
  ('00000000-0000-4000-8000-000000003002', '00000000-0000-4000-8000-000000002004', '2026-07-09T14:30:00+08:00', 60, 'Zoom', 'https://zoom.us/j/local-demo-ses-2', 'Lee Wei · ZH-EN', 'Amir Rahman', 'Completed', 'Both sides want a September site visit and technical workshop.')
on conflict (id) do update set
  match_id = excluded.match_id,
  starts_at = excluded.starts_at,
  duration_minutes = excluded.duration_minutes,
  platform = excluded.platform,
  link = excluded.link,
  interpreter = excluded.interpreter,
  host = excluded.host,
  status = excluded.status,
  summary = excluded.summary;

insert into public.deals
  (id, match_id, status, document, signatory_check)
values
  ('00000000-0000-4000-8000-000000004001', '00000000-0000-4000-8000-000000002004', 'Agreement Reached', 'AgriCloud-JohorHub-MOU-draft.pdf', 'Verified'),
  ('00000000-0000-4000-8000-000000004002', '00000000-0000-4000-8000-000000002001', 'Under Discussion', 'Pending upload', 'Pending')
on conflict (id) do update set
  match_id = excluded.match_id,
  status = excluded.status,
  document = excluded.document,
  signatory_check = excluded.signatory_check;

insert into public.itinerary_slots
  (id, day_label, start_time, activity, venue, escort, published, sort_order)
values
  ('00000000-0000-4000-8000-000000005001', 'Day 1 · 8 Sep', '09:00', 'Delegation arrival and welcome briefing', 'KLIA + EQ Kuala Lumpur', 'Sarah Lim', true, 1),
  ('00000000-0000-4000-8000-000000005002', 'Day 2 · 9 Sep', '10:30', 'Face-to-face business matching roundtables', 'MATRADE Hall B', 'Amir Rahman', true, 2),
  ('00000000-0000-4000-8000-000000005003', 'Day 3 · 10 Sep', '14:00', 'Company site visits and official liaison calls', 'Selangor + Putrajaya', 'Melissa Tan', false, 3)
on conflict (id) do update set
  day_label = excluded.day_label,
  start_time = excluded.start_time,
  activity = excluded.activity,
  venue = excluded.venue,
  escort = excluded.escort,
  published = excluded.published,
  sort_order = excluded.sort_order;

insert into public.site_visits
  (id, venue, visit_date, start_time, driver, escort, status, notes)
values
  ('00000000-0000-4000-8000-000000006001', 'Selangor EV Operations Centre', '2026-09-10', '10:00', 'Driver A', 'Sarah Lim', 'Confirmed', 'Bring technical specs and pilot district maps.'),
  ('00000000-0000-4000-8000-000000006002', 'Johor Agro Innovation Hub', '2026-09-11', '09:30', 'Driver B', 'Melissa Tan', 'Planned', 'Coordinate farm boots and translation briefing.')
on conflict (id) do update set
  venue = excluded.venue,
  visit_date = excluded.visit_date,
  start_time = excluded.start_time,
  driver = excluded.driver,
  escort = excluded.escort,
  status = excluded.status,
  notes = excluded.notes;

insert into public.site_visit_delegations (site_visit_id, delegation_company_id)
values
  ('00000000-0000-4000-8000-000000006001', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000006002', '00000000-0000-4000-8000-000000000003')
on conflict do nothing;

insert into public.liaison_contacts
  (id, name, title, organisation, status, protocol)
values
  ('00000000-0000-4000-8000-000000007001', 'Dato'' Seri Ahmad Rahim', 'Senior Director', 'MATRADE', 'Confirmed', 'Use formal title in opening remarks; share delegation one-pager 48h prior.'),
  ('00000000-0000-4000-8000-000000007002', 'Tan Mei Ling', 'Investment Desk Lead', 'MIDA', 'Draft', 'Brief on sectors: EV infrastructure, HealthTech, AgriTech.')
on conflict (id) do update set
  name = excluded.name,
  title = excluded.title,
  organisation = excluded.organisation,
  status = excluded.status,
  protocol = excluded.protocol;

insert into public.notifications (id, message, created_at)
values
  ('00000000-0000-4000-8000-000000008001', '2 delegation companies have fewer than 2 confirmed matches.', now() - interval '3 minutes'),
  ('00000000-0000-4000-8000-000000008002', 'VooV links are pre-generated for China network compatibility.', now() - interval '2 minutes'),
  ('00000000-0000-4000-8000-000000008003', 'September check-in QR codes are ready for confirmed partners.', now() - interval '1 minute')
on conflict (id) do update set
  message = excluded.message,
  created_at = excluded.created_at;
