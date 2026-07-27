-- Canonical three-tier authorization model:
--   superadmin -> all tenants
--   admin      -> one admin tenant
--   vendor     -> one vendor company within one admin tenant

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create or replace function public.current_app_role()
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when auth.jwt() -> 'app_metadata' ->> 'role'
      in ('superadmin', 'admin', 'vendor')
    then auth.jwt() -> 'app_metadata' ->> 'role'
    else null
  end
$$;

create or replace function public.current_admin_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select case
    when auth.jwt() -> 'app_metadata' ->> 'admin_id'
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then (auth.jwt() -> 'app_metadata' ->> 'admin_id')::uuid
    else null
  end
$$;

create or replace function public.current_vendor_company_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select case
    when auth.jwt() -> 'app_metadata' ->> 'vendor_company_id'
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then (auth.jwt() -> 'app_metadata' ->> 'vendor_company_id')::uuid
    else null
  end
$$;

create or replace function public.current_vendor_type()
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when auth.jwt() -> 'app_metadata' ->> 'vendor_type'
      in ('delegation', 'partner')
    then auth.jwt() -> 'app_metadata' ->> 'vendor_type'
    else null
  end
$$;

-- Compatibility helpers for the legacy company tables. Authorization remains
-- canonical: the top-level role is vendor and the subtype is vendor_type.
create or replace function public.current_delegation_company_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select case
    when public.current_app_role() = 'vendor'
      and public.current_vendor_type() = 'delegation'
    then public.current_vendor_company_id()
    else null
  end
$$;

create or replace function public.current_partner_company_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select case
    when public.current_app_role() = 'vendor'
      and public.current_vendor_type() = 'partner'
    then public.current_vendor_company_id()
    else null
  end
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.current_admin_id() from public;
revoke all on function public.current_vendor_company_id() from public;
revoke all on function public.current_vendor_type() from public;
revoke all on function public.current_delegation_company_id() from public;
revoke all on function public.current_partner_company_id() from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.current_admin_id() to authenticated;
grant execute on function public.current_vendor_company_id() to authenticated;
grant execute on function public.current_vendor_type() to authenticated;
grant execute on function public.current_delegation_company_id() to authenticated;
grant execute on function public.current_partner_company_id() to authenticated;

create table if not exists public.admin_tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  support_email text not null default '',
  logo_url text not null default '',
  primary_color text not null default '#16839a',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_companies (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_tenants(id) on delete restrict,
  vendor_type text not null check (vendor_type in ('delegation', 'partner')),
  name_en text not null,
  name_cn text not null default '',
  sector text not null default 'Pending',
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, admin_id),
  unique (id, vendor_type)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  target_table text not null,
  target_id uuid,
  admin_id uuid references public.admin_tenants(id) on delete set null,
  request_id text,
  before_values jsonb,
  after_values jsonb,
  created_at timestamptz not null default now()
);

insert into public.admin_tenants (
  slug,
  name,
  status,
  support_email
)
values (
  'plexus-managed',
  'Plexus Managed',
  'active',
  ''
)
on conflict (slug) do nothing;

alter table public.delegation_companies
  add column if not exists admin_id uuid,
  add column if not exists vendor_company_id uuid,
  add column if not exists vendor_type text;

alter table public.partner_companies
  add column if not exists admin_id uuid,
  add column if not exists vendor_company_id uuid,
  add column if not exists vendor_type text;

update public.delegation_companies
set
  admin_id = coalesce(
    admin_id,
    (select id from public.admin_tenants where slug = 'plexus-managed')
  ),
  vendor_company_id = coalesce(vendor_company_id, id),
  vendor_type = 'delegation'
where admin_id is null
   or vendor_company_id is null
   or vendor_type is distinct from 'delegation';

update public.partner_companies
set
  admin_id = coalesce(
    admin_id,
    (select id from public.admin_tenants where slug = 'plexus-managed')
  ),
  vendor_company_id = coalesce(vendor_company_id, id),
  vendor_type = 'partner'
where admin_id is null
   or vendor_company_id is null
   or vendor_type is distinct from 'partner';

insert into public.vendor_companies (
  id,
  admin_id,
  vendor_type,
  name_en,
  name_cn,
  sector,
  status
)
select
  vendor_company_id,
  admin_id,
  'delegation',
  name_en,
  name_cn,
  sector,
  'active'
from public.delegation_companies
on conflict (id) do update set
  admin_id = excluded.admin_id,
  vendor_type = excluded.vendor_type,
  name_en = excluded.name_en,
  name_cn = excluded.name_cn,
  sector = excluded.sector;

insert into public.vendor_companies (
  id,
  admin_id,
  vendor_type,
  name_en,
  name_cn,
  sector,
  status
)
select
  vendor_company_id,
  admin_id,
  'partner',
  name_en,
  name_cn,
  sector,
  'active'
from public.partner_companies
on conflict (id) do update set
  admin_id = excluded.admin_id,
  vendor_type = excluded.vendor_type,
  name_en = excluded.name_en,
  name_cn = excluded.name_cn,
  sector = excluded.sector;

alter table public.delegation_companies
  alter column admin_id set not null,
  alter column vendor_company_id set not null,
  alter column vendor_type set not null,
  alter column vendor_type set default 'delegation',
  alter column admin_id set default public.current_admin_id();

alter table public.partner_companies
  alter column admin_id set not null,
  alter column vendor_company_id set not null,
  alter column vendor_type set not null,
  alter column vendor_type set default 'partner',
  alter column admin_id set default public.current_admin_id();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'delegation_companies_admin_id_fkey'
  ) then
    alter table public.delegation_companies
      add constraint delegation_companies_admin_id_fkey
      foreign key (admin_id) references public.admin_tenants(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'delegation_companies_vendor_company_id_fkey'
  ) then
    alter table public.delegation_companies
      add constraint delegation_companies_vendor_company_id_fkey
      foreign key (vendor_company_id) references public.vendor_companies(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'delegation_companies_vendor_type_check'
  ) then
    alter table public.delegation_companies
      add constraint delegation_companies_vendor_type_check
      check (vendor_type = 'delegation');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'delegation_companies_vendor_company_id_key'
  ) then
    alter table public.delegation_companies
      add constraint delegation_companies_vendor_company_id_key
      unique (vendor_company_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'delegation_companies_id_admin_id_key'
  ) then
    alter table public.delegation_companies
      add constraint delegation_companies_id_admin_id_key
      unique (id, admin_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'partner_companies_admin_id_fkey'
  ) then
    alter table public.partner_companies
      add constraint partner_companies_admin_id_fkey
      foreign key (admin_id) references public.admin_tenants(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'partner_companies_vendor_company_id_fkey'
  ) then
    alter table public.partner_companies
      add constraint partner_companies_vendor_company_id_fkey
      foreign key (vendor_company_id) references public.vendor_companies(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'partner_companies_vendor_type_check'
  ) then
    alter table public.partner_companies
      add constraint partner_companies_vendor_type_check
      check (vendor_type = 'partner');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'partner_companies_vendor_company_id_key'
  ) then
    alter table public.partner_companies
      add constraint partner_companies_vendor_company_id_key
      unique (vendor_company_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'partner_companies_id_admin_id_key'
  ) then
    alter table public.partner_companies
      add constraint partner_companies_id_admin_id_key
      unique (id, admin_id);
  end if;
end
$$;

-- Carry tenant ownership to every operational record.
alter table public.matches add column if not exists admin_id uuid;
alter table public.meetings add column if not exists admin_id uuid;
alter table public.deals add column if not exists admin_id uuid;
alter table public.itinerary_slots add column if not exists admin_id uuid;
alter table public.site_visits add column if not exists admin_id uuid;
alter table public.site_visit_delegations add column if not exists admin_id uuid;
alter table public.liaison_contacts add column if not exists admin_id uuid;
alter table public.notifications add column if not exists admin_id uuid;
alter table public.announcements add column if not exists admin_id uuid;
alter table public.event_resources add column if not exists admin_id uuid;
alter table public.interpreters add column if not exists admin_id uuid;
alter table public.match_candidate_directory add column if not exists admin_id uuid;

update public.matches row
set admin_id = company.admin_id
from public.delegation_companies company
where company.id = row.delegation_company_id
  and row.admin_id is null;

update public.meetings row
set admin_id = match.admin_id
from public.matches match
where match.id = row.match_id
  and row.admin_id is null;

update public.deals row
set admin_id = match.admin_id
from public.matches match
where match.id = row.match_id
  and row.admin_id is null;

update public.site_visit_delegations row
set admin_id = company.admin_id
from public.delegation_companies company
where company.id = row.delegation_company_id
  and row.admin_id is null;

update public.site_visits visit
set admin_id = assignment.admin_id
from (
  select site_visit_id, min(admin_id::text)::uuid as admin_id
  from public.site_visit_delegations
  group by site_visit_id
) assignment
where assignment.site_visit_id = visit.id
  and visit.admin_id is null;

update public.itinerary_slots
set admin_id = (select id from public.admin_tenants where slug = 'plexus-managed')
where admin_id is null;

update public.site_visits
set admin_id = (select id from public.admin_tenants where slug = 'plexus-managed')
where admin_id is null;

update public.liaison_contacts
set admin_id = (select id from public.admin_tenants where slug = 'plexus-managed')
where admin_id is null;

update public.notifications
set admin_id = (select id from public.admin_tenants where slug = 'plexus-managed')
where admin_id is null;

update public.announcements
set admin_id = (select id from public.admin_tenants where slug = 'plexus-managed')
where admin_id is null;

update public.event_resources
set admin_id = (select id from public.admin_tenants where slug = 'plexus-managed')
where admin_id is null;

update public.interpreters
set admin_id = (select id from public.admin_tenants where slug = 'plexus-managed')
where admin_id is null;

update public.match_candidate_directory directory
set admin_id = source.admin_id
from (
  select 'delegation'::text as company_type, id, admin_id
  from public.delegation_companies
  union all
  select 'partner'::text as company_type, id, admin_id
  from public.partner_companies
) source
where source.company_type = directory.company_type
  and source.id = directory.id
  and directory.admin_id is null;

alter table public.matches
  alter column admin_id set not null,
  alter column admin_id set default public.current_admin_id();
alter table public.meetings
  alter column admin_id set not null,
  alter column admin_id set default public.current_admin_id();
alter table public.deals
  alter column admin_id set not null,
  alter column admin_id set default public.current_admin_id();
alter table public.itinerary_slots
  alter column admin_id set not null,
  alter column admin_id set default public.current_admin_id();
alter table public.site_visits
  alter column admin_id set not null,
  alter column admin_id set default public.current_admin_id();
alter table public.site_visit_delegations
  alter column admin_id set not null,
  alter column admin_id set default public.current_admin_id();
alter table public.liaison_contacts
  alter column admin_id set not null,
  alter column admin_id set default public.current_admin_id();
alter table public.notifications
  alter column admin_id set not null,
  alter column admin_id set default public.current_admin_id();
alter table public.announcements
  alter column admin_id set not null,
  alter column admin_id set default public.current_admin_id();
alter table public.event_resources
  alter column admin_id set not null,
  alter column admin_id set default public.current_admin_id();
alter table public.interpreters
  alter column admin_id set not null,
  alter column admin_id set default public.current_admin_id();
alter table public.match_candidate_directory
  alter column admin_id set not null;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'matches',
    'meetings',
    'deals',
    'itinerary_slots',
    'site_visits',
    'site_visit_delegations',
    'liaison_contacts',
    'notifications',
    'announcements',
    'event_resources',
    'interpreters',
    'match_candidate_directory'
  ]
  loop
    if not exists (
      select 1
      from pg_constraint
      where conname = table_name || '_admin_id_fkey'
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (admin_id) references public.admin_tenants(id) on delete restrict',
        table_name,
        table_name || '_admin_id_fkey'
      );
    end if;
  end loop;

  if not exists (
    select 1 from pg_constraint where conname = 'matches_id_admin_id_key'
  ) then
    alter table public.matches
      add constraint matches_id_admin_id_key unique (id, admin_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'matches_delegation_admin_fkey'
  ) then
    alter table public.matches
      add constraint matches_delegation_admin_fkey
      foreign key (delegation_company_id, admin_id)
      references public.delegation_companies(id, admin_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'matches_partner_admin_fkey'
  ) then
    alter table public.matches
      add constraint matches_partner_admin_fkey
      foreign key (partner_company_id, admin_id)
      references public.partner_companies(id, admin_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'meetings_match_admin_fkey'
  ) then
    alter table public.meetings
      add constraint meetings_match_admin_fkey
      foreign key (match_id, admin_id)
      references public.matches(id, admin_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'deals_match_admin_fkey'
  ) then
    alter table public.deals
      add constraint deals_match_admin_fkey
      foreign key (match_id, admin_id)
      references public.matches(id, admin_id)
      on delete cascade;
  end if;
end
$$;

-- Migrate application profiles to canonical roles and bindings.
alter table public.user_profiles
  add column if not exists email text not null default '',
  add column if not exists admin_id uuid,
  add column if not exists vendor_company_id uuid,
  add column if not exists vendor_type text,
  add column if not exists active boolean not null default true;

update public.user_profiles profile
set
  role = 'vendor',
  admin_id = company.admin_id,
  vendor_company_id = profile.delegation_company_id,
  vendor_type = 'delegation'
from public.delegation_companies company
where profile.role = 'delegation'
  and company.id = profile.delegation_company_id;

update public.user_profiles profile
set
  role = 'vendor',
  admin_id = company.admin_id,
  vendor_company_id = profile.partner_company_id,
  vendor_type = 'partner'
from public.partner_companies company
where profile.role = 'partner'
  and company.id = profile.partner_company_id;

update public.user_profiles
set admin_id = (
  select id from public.admin_tenants where slug = 'plexus-managed'
)
where role = 'admin'
  and admin_id is null;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.user_profiles'::regclass
      and contype = 'c'
  loop
    execute format(
      'alter table public.user_profiles drop constraint %I',
      constraint_name
    );
  end loop;
end
$$;

alter table public.user_profiles
  add constraint user_profiles_role_check
    check (role in ('superadmin', 'admin', 'vendor')),
  add constraint user_profiles_binding_check
    check (
      (role = 'superadmin'
        and admin_id is null
        and vendor_company_id is null
        and vendor_type is null)
      or
      (role = 'admin'
        and admin_id is not null
        and vendor_company_id is null
        and vendor_type is null)
      or
      (role = 'vendor'
        and admin_id is not null
        and vendor_company_id is not null
        and vendor_type in ('delegation', 'partner'))
    );

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_profiles_admin_id_fkey'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_admin_id_fkey
      foreign key (admin_id) references public.admin_tenants(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'user_profiles_vendor_binding_fkey'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_vendor_binding_fkey
      foreign key (vendor_company_id, admin_id)
      references public.vendor_companies(id, admin_id)
      on update cascade
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'user_profiles_vendor_type_fkey'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_vendor_type_fkey
      foreign key (vendor_company_id, vendor_type)
      references public.vendor_companies(id, vendor_type) on delete restrict;
  end if;
end
$$;

create or replace trigger touch_admin_tenants_updated_at
  before update on public.admin_tenants
  for each row execute function public.touch_updated_at();

create or replace trigger touch_vendor_companies_updated_at
  before update on public.vendor_companies
  for each row execute function public.touch_updated_at();

create or replace function private.current_actor_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case public.current_app_role()
    when 'superadmin' then exists (
      select 1
      from public.user_profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'superadmin'
        and profile.active
        and profile.admin_id is null
        and profile.vendor_company_id is null
    )
    when 'admin' then exists (
      select 1
      from public.user_profiles profile
      join public.admin_tenants tenant
        on tenant.id = profile.admin_id
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
        and profile.active
        and profile.admin_id = public.current_admin_id()
        and tenant.status = 'active'
    )
    when 'vendor' then exists (
      select 1
      from public.user_profiles profile
      join public.vendor_companies vendor
        on vendor.id = profile.vendor_company_id
       and vendor.admin_id = profile.admin_id
       and vendor.vendor_type = profile.vendor_type
      join public.admin_tenants tenant
        on tenant.id = profile.admin_id
      where profile.id = (select auth.uid())
        and profile.role = 'vendor'
        and profile.active
        and profile.admin_id = public.current_admin_id()
        and profile.vendor_company_id = public.current_vendor_company_id()
        and profile.vendor_type = public.current_vendor_type()
        and vendor.status = 'active'
        and tenant.status = 'active'
    )
    else false
  end
$$;

revoke all on function private.current_actor_is_active() from public;
revoke all on function private.current_actor_is_active() from anon;
revoke all on function private.current_actor_is_active() from authenticated;
grant usage on schema private to authenticated;
grant execute on function private.current_actor_is_active() to authenticated;

create or replace function private.sync_legacy_vendor_company()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  subtype text := tg_argv[0];
begin
  if tg_op = 'DELETE' then
    update public.vendor_companies
    set status = 'archived'
    where id = old.vendor_company_id;
    return old;
  end if;

  if new.admin_id is null then
    new.admin_id := public.current_admin_id();
  end if;

  if new.vendor_company_id is null then
    new.vendor_company_id := new.id;
  end if;

  new.vendor_type := subtype;

  if new.admin_id is null then
    raise exception 'An admin tenant is required for every vendor';
  end if;

  if tg_op = 'UPDATE'
    and old.admin_id is distinct from new.admin_id
    and public.current_app_role() is distinct from 'superadmin'
  then
    raise exception 'Only a superadmin can move a vendor between tenants';
  end if;

  insert into public.vendor_companies (
    id,
    admin_id,
    vendor_type,
    name_en,
    name_cn,
    sector,
    status,
    created_by
  )
  values (
    new.vendor_company_id,
    new.admin_id,
    subtype,
    new.name_en,
    new.name_cn,
    new.sector,
    'active',
    (select auth.uid())
  )
  on conflict (id) do update set
    admin_id = excluded.admin_id,
    vendor_type = excluded.vendor_type,
    name_en = excluded.name_en,
    name_cn = excluded.name_cn,
    sector = excluded.sector;

  return new;
end
$$;

revoke all on function private.sync_legacy_vendor_company() from public;
revoke all on function private.sync_legacy_vendor_company() from anon;
revoke all on function private.sync_legacy_vendor_company() from authenticated;

drop trigger if exists sync_delegation_vendor_company
  on public.delegation_companies;
create trigger sync_delegation_vendor_company
  before insert or update or delete on public.delegation_companies
  for each row execute function private.sync_legacy_vendor_company('delegation');

drop trigger if exists sync_partner_vendor_company
  on public.partner_companies;
create trigger sync_partner_vendor_company
  before insert or update or delete on public.partner_companies
  for each row execute function private.sync_legacy_vendor_company('partner');

create or replace function private.protect_match_tenant_bindings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    old.admin_id is distinct from new.admin_id
    or old.delegation_company_id is distinct from new.delegation_company_id
    or old.partner_company_id is distinct from new.partner_company_id
  )
  and public.current_app_role() is distinct from 'superadmin'
  then
    raise exception 'Match tenant and company bindings are immutable';
  end if;

  return new;
end
$$;

drop trigger if exists protect_match_tenant_bindings on public.matches;
create trigger protect_match_tenant_bindings
  before update on public.matches
  for each row execute function private.protect_match_tenant_bindings();

create or replace function private.sync_match_candidate_directory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.match_candidate_directory
    where company_type = tg_argv[0]
      and id = old.id;
    return old;
  end if;

  insert into public.match_candidate_directory (
    company_type,
    id,
    admin_id,
    name_en,
    name_cn,
    sector
  )
  values (
    tg_argv[0],
    new.id,
    new.admin_id,
    new.name_en,
    new.name_cn,
    new.sector
  )
  on conflict (company_type, id) do update set
    admin_id = excluded.admin_id,
    name_en = excluded.name_en,
    name_cn = excluded.name_cn,
    sector = excluded.sector;

  return new;
end
$$;

revoke all on function private.sync_match_candidate_directory() from public;
revoke all on function private.sync_match_candidate_directory() from anon;
revoke all on function private.sync_match_candidate_directory() from authenticated;

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
$$;

revoke all on function public.match_candidates() from public;
revoke all on function public.match_candidates() from anon;
grant execute on function public.match_candidates() to authenticated;

-- A Vendor transfer is a single, audited database operation. Existing matches
-- and visit assignments deliberately block transfer because moving one side
-- would otherwise create cross-tenant operational records.
create or replace function public.transfer_vendor(
  p_vendor_id uuid,
  p_destination_admin_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  vendor_row public.vendor_companies%rowtype;
begin
  if not (select private.current_actor_is_active())
    or public.current_app_role() is distinct from 'superadmin'
  then
    raise exception 'Only an active Superadmin can transfer Vendors';
  end if;

  select *
  into vendor_row
  from public.vendor_companies
  where id = p_vendor_id;

  if not found then
    raise exception 'Vendor does not exist';
  end if;

  if not exists (
    select 1
    from public.admin_tenants
    where id = p_destination_admin_id
      and status = 'active'
  ) then
    raise exception 'Destination Admin tenant is not active';
  end if;

  if vendor_row.admin_id = p_destination_admin_id then
    return;
  end if;

  if exists (
    select 1
    from public.matches
    where delegation_company_id = p_vendor_id
       or partner_company_id = p_vendor_id
  ) then
    raise exception 'Resolve or archive this Vendor''s matches before transfer';
  end if;

  if vendor_row.vendor_type = 'delegation'
    and exists (
      select 1
      from public.site_visit_delegations
      where delegation_company_id = p_vendor_id
    )
  then
    raise exception 'Remove this Vendor from site visits before transfer';
  end if;

  if vendor_row.vendor_type = 'delegation' then
    update public.delegation_companies
    set admin_id = p_destination_admin_id
    where vendor_company_id = p_vendor_id;
  else
    update public.partner_companies
    set admin_id = p_destination_admin_id
    where vendor_company_id = p_vendor_id;
  end if;

  if not found then
    raise exception 'Vendor subtype record does not exist';
  end if;
end
$$;

revoke all on function public.transfer_vendor(uuid, uuid) from public;
revoke all on function public.transfer_vendor(uuid, uuid) from anon;
grant execute on function public.transfer_vendor(uuid, uuid) to authenticated;

create or replace function private.audit_privileged_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_before jsonb;
  row_after jsonb;
  target_uuid uuid;
  tenant_uuid uuid;
begin
  row_before := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  row_after := case when tg_op = 'DELETE' then null else to_jsonb(new) end;

  target_uuid := case
    when tg_op = 'DELETE' then old.id
    else new.id
  end;

  tenant_uuid := case
    when tg_table_name = 'admin_tenants' then target_uuid
    when tg_op = 'DELETE' then nullif(row_before ->> 'admin_id', '')::uuid
    else nullif(row_after ->> 'admin_id', '')::uuid
  end;

  insert into public.audit_events (
    actor_user_id,
    actor_role,
    action,
    target_table,
    target_id,
    admin_id,
    request_id,
    before_values,
    after_values
  )
  values (
    (select auth.uid()),
    public.current_app_role(),
    lower(tg_op),
    tg_table_name,
    target_uuid,
    tenant_uuid,
    auth.jwt() ->> 'session_id',
    row_before,
    row_after
  );

  return coalesce(new, old);
end
$$;

revoke all on function private.audit_privileged_change() from public;
revoke all on function private.audit_privileged_change() from anon;
revoke all on function private.audit_privileged_change() from authenticated;

drop trigger if exists audit_admin_tenants on public.admin_tenants;
create trigger audit_admin_tenants
  after insert or update or delete on public.admin_tenants
  for each row execute function private.audit_privileged_change();

drop trigger if exists audit_vendor_companies on public.vendor_companies;
create trigger audit_vendor_companies
  after insert or update or delete on public.vendor_companies
  for each row execute function private.audit_privileged_change();

drop trigger if exists audit_user_profiles on public.user_profiles;
create trigger audit_user_profiles
  after insert or update or delete on public.user_profiles
  for each row execute function private.audit_privileged_change();

create index if not exists admin_tenants_status_idx
  on public.admin_tenants(status);
create index if not exists vendor_companies_admin_id_idx
  on public.vendor_companies(admin_id);
create index if not exists vendor_companies_type_idx
  on public.vendor_companies(vendor_type);
create index if not exists vendor_companies_status_idx
  on public.vendor_companies(status);
create index if not exists user_profiles_admin_id_idx
  on public.user_profiles(admin_id);
create index if not exists user_profiles_vendor_company_id_idx
  on public.user_profiles(vendor_company_id);
create index if not exists user_profiles_active_idx
  on public.user_profiles(active);
create index if not exists audit_events_admin_id_created_at_idx
  on public.audit_events(admin_id, created_at desc);
create index if not exists audit_events_actor_created_at_idx
  on public.audit_events(actor_user_id, created_at desc);

create index if not exists delegation_companies_admin_id_idx
  on public.delegation_companies(admin_id);
create index if not exists partner_companies_admin_id_idx
  on public.partner_companies(admin_id);
create index if not exists matches_admin_id_idx on public.matches(admin_id);
create index if not exists meetings_admin_id_idx on public.meetings(admin_id);
create index if not exists deals_admin_id_idx on public.deals(admin_id);
create index if not exists itinerary_slots_admin_id_idx
  on public.itinerary_slots(admin_id);
create index if not exists site_visits_admin_id_idx
  on public.site_visits(admin_id);
create index if not exists site_visit_delegations_admin_id_idx
  on public.site_visit_delegations(admin_id);
create index if not exists liaison_contacts_admin_id_idx
  on public.liaison_contacts(admin_id);
create index if not exists notifications_admin_id_idx
  on public.notifications(admin_id);
create index if not exists announcements_admin_id_idx
  on public.announcements(admin_id);
create index if not exists event_resources_admin_id_idx
  on public.event_resources(admin_id);
create index if not exists interpreters_admin_id_idx
  on public.interpreters(admin_id);
create index if not exists match_candidate_directory_admin_id_idx
  on public.match_candidate_directory(admin_id);

alter table public.admin_tenants enable row level security;
alter table public.vendor_companies enable row level security;
alter table public.audit_events enable row level security;

do $$
declare
  policy record;
begin
  for policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'admin_tenants',
        'vendor_companies',
        'audit_events',
        'user_profiles',
        'delegation_companies',
        'partner_companies',
        'matches',
        'meetings',
        'deals',
        'itinerary_slots',
        'site_visits',
        'site_visit_delegations',
        'liaison_contacts',
        'notifications',
        'announcements',
        'event_resources',
        'interpreters',
        'match_candidate_directory'
      ])
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy.policyname,
      policy.schemaname,
      policy.tablename
    );
  end loop;
end
$$;

-- Tenant directory
create policy "tenant select access"
  on public.admin_tenants for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or id = public.current_admin_id()
    )
  );

create policy "superadmin inserts tenants"
  on public.admin_tenants for insert to authenticated
  with check (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  );

create policy "superadmin updates tenants"
  on public.admin_tenants for update to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  )
  with check (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  );

create policy "superadmin deletes tenants"
  on public.admin_tenants for delete to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  );

-- Canonical vendor directory
create policy "vendor directory select access"
  on public.vendor_companies for select to authenticated
  using (
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
        and id = public.current_vendor_company_id()
        and vendor_type = public.current_vendor_type()
      )
    )
  );

create policy "operator inserts vendors"
  on public.vendor_companies for insert to authenticated
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "operator updates vendors"
  on public.vendor_companies for update to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "superadmin deletes vendors"
  on public.vendor_companies for delete to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  );

-- Account profiles
create policy "profile select access"
  on public.user_profiles for select to authenticated
  using (
    (
      id = (select auth.uid())
      and active
    )
    or (
      (select private.current_actor_is_active())
      and (
        public.current_app_role() = 'superadmin'
        or (
          public.current_app_role() = 'admin'
          and role = 'vendor'
          and admin_id = public.current_admin_id()
        )
      )
    )
  );

create policy "operator inserts profiles"
  on public.user_profiles for insert to authenticated
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and role = 'vendor'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "operator updates profiles"
  on public.user_profiles for update to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and role = 'vendor'
        and admin_id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and role = 'vendor'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "superadmin deletes profiles"
  on public.user_profiles for delete to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'superadmin'
  );

create policy "audit select access"
  on public.audit_events for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

-- Legacy vendor subtype records
create policy "delegation select access"
  on public.delegation_companies for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
      or (
        public.current_app_role() = 'vendor'
        and public.current_vendor_type() = 'delegation'
        and admin_id = public.current_admin_id()
        and vendor_company_id = public.current_vendor_company_id()
      )
    )
  );

create policy "delegation insert access"
  on public.delegation_companies for insert to authenticated
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "delegation update access"
  on public.delegation_companies for update to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
      or (
        public.current_app_role() = 'vendor'
        and public.current_vendor_type() = 'delegation'
        and admin_id = public.current_admin_id()
        and vendor_company_id = public.current_vendor_company_id()
      )
    )
  )
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
        and public.current_vendor_type() = 'delegation'
        and admin_id = public.current_admin_id()
        and vendor_company_id = public.current_vendor_company_id()
      )
    )
  );

create policy "delegation delete access"
  on public.delegation_companies for delete to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "partner select access"
  on public.partner_companies for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
      or (
        public.current_app_role() = 'vendor'
        and public.current_vendor_type() = 'partner'
        and admin_id = public.current_admin_id()
        and vendor_company_id = public.current_vendor_company_id()
      )
    )
  );

create policy "partner insert access"
  on public.partner_companies for insert to authenticated
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "partner update access"
  on public.partner_companies for update to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
      or (
        public.current_app_role() = 'vendor'
        and public.current_vendor_type() = 'partner'
        and admin_id = public.current_admin_id()
        and vendor_company_id = public.current_vendor_company_id()
      )
    )
  )
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
        and public.current_vendor_type() = 'partner'
        and admin_id = public.current_admin_id()
        and vendor_company_id = public.current_vendor_company_id()
      )
    )
  );

create policy "partner delete access"
  on public.partner_companies for delete to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

-- Matches and related operations
create policy "matches select access"
  on public.matches for select to authenticated
  using (
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
        and (
          delegation_company_id = public.current_vendor_company_id()
          or partner_company_id = public.current_vendor_company_id()
        )
      )
    )
  );

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

create policy "matches update access"
  on public.matches for update to authenticated
  using (
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
        and (
          delegation_company_id = public.current_vendor_company_id()
          or partner_company_id = public.current_vendor_company_id()
        )
      )
    )
  )
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
        and (
          delegation_company_id = public.current_vendor_company_id()
          or partner_company_id = public.current_vendor_company_id()
        )
      )
    )
  );

create policy "matches delete access"
  on public.matches for delete to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "meetings select access"
  on public.meetings for select to authenticated
  using (
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
          from public.matches match
          where match.id = meetings.match_id
            and (
              match.delegation_company_id = public.current_vendor_company_id()
              or match.partner_company_id = public.current_vendor_company_id()
            )
        )
      )
    )
  );

create policy "meetings insert access"
  on public.meetings for insert to authenticated
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
          from public.matches match
          where match.id = meetings.match_id
            and (
              match.delegation_company_id = public.current_vendor_company_id()
              or match.partner_company_id = public.current_vendor_company_id()
            )
        )
      )
    )
  );

create policy "meetings update access"
  on public.meetings for update to authenticated
  using (
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
          from public.matches match
          where match.id = meetings.match_id
            and (
              match.delegation_company_id = public.current_vendor_company_id()
              or match.partner_company_id = public.current_vendor_company_id()
            )
        )
      )
    )
  )
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
          from public.matches match
          where match.id = meetings.match_id
            and (
              match.delegation_company_id = public.current_vendor_company_id()
              or match.partner_company_id = public.current_vendor_company_id()
            )
        )
      )
    )
  );

create policy "meetings delete access"
  on public.meetings for delete to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "deals select access"
  on public.deals for select to authenticated
  using (
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
          from public.matches match
          where match.id = deals.match_id
            and (
              match.delegation_company_id = public.current_vendor_company_id()
              or match.partner_company_id = public.current_vendor_company_id()
            )
        )
      )
    )
  );

create policy "operator inserts deals"
  on public.deals for insert to authenticated
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "operator updates deals"
  on public.deals for update to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "operator deletes deals"
  on public.deals for delete to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

-- Tenant-wide workflow tables
create policy "itinerary select access"
  on public.itinerary_slots for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        admin_id = public.current_admin_id()
        and (
          public.current_app_role() = 'admin'
          or (
            public.current_app_role() = 'vendor'
            and published
          )
        )
      )
    )
  );

create policy "operator manages itinerary"
  on public.itinerary_slots for all to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "site visits select access"
  on public.site_visits for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
      or (
        public.current_app_role() = 'vendor'
        and public.current_vendor_type() = 'delegation'
        and admin_id = public.current_admin_id()
        and exists (
          select 1
          from public.site_visit_delegations assignment
          where assignment.site_visit_id = site_visits.id
            and assignment.delegation_company_id =
              public.current_vendor_company_id()
        )
      )
    )
  );

create policy "operator manages site visits"
  on public.site_visits for all to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "site visit assignments select access"
  on public.site_visit_delegations for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
      or (
        public.current_app_role() = 'vendor'
        and public.current_vendor_type() = 'delegation'
        and admin_id = public.current_admin_id()
        and delegation_company_id = public.current_vendor_company_id()
      )
    )
  );

create policy "operator manages site visit assignments"
  on public.site_visit_delegations for all to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "liaison select access"
  on public.liaison_contacts for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or admin_id = public.current_admin_id()
    )
  );

create policy "operator manages liaison"
  on public.liaison_contacts for all to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "notifications select access"
  on public.notifications for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or admin_id = public.current_admin_id()
    )
  );

create policy "operator manages notifications"
  on public.notifications for all to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "announcements select access"
  on public.announcements for select to authenticated
  using (
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
        and (
          target = 'all'
          or target = public.current_vendor_type()
        )
      )
    )
  );

create policy "operator manages announcements"
  on public.announcements for all to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "resources select access"
  on public.event_resources for select to authenticated
  using (
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
        and (
          audience = 'all'
          or audience = public.current_vendor_type()
        )
      )
    )
  );

create policy "operator manages resources"
  on public.event_resources for all to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "interpreters select access"
  on public.interpreters for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or admin_id = public.current_admin_id()
    )
  );

create policy "operator manages interpreters"
  on public.interpreters for all to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  )
  with check (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
    )
  );

create policy "match directory select access"
  on public.match_candidate_directory for select to authenticated
  using (
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
        and company_type <> public.current_vendor_type()
      )
    )
  );

-- Explicit Data API grants. RLS remains the row boundary.
revoke all on public.admin_tenants from anon;
revoke all on public.vendor_companies from anon;
revoke all on public.audit_events from anon;
revoke all on public.admin_tenants from authenticated;
revoke all on public.vendor_companies from authenticated;
revoke all on public.audit_events from authenticated;

grant select, insert, update, delete
  on public.admin_tenants to authenticated;
grant select, insert, update, delete
  on public.vendor_companies to authenticated;
grant select on public.audit_events to authenticated;

-- Storage objects are tenant-prefixed: <admin_id>/materials/<file>.
drop policy if exists "admin manages event resource files" on storage.objects;
drop policy if exists "authenticated reads event resource files" on storage.objects;
drop policy if exists "operator manages tenant resource files" on storage.objects;
drop policy if exists "tenant reads resource files" on storage.objects;

create policy "operator manages tenant resource files"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'event-resources'
    and (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and (storage.foldername(name))[1] = public.current_admin_id()::text
      )
    )
  )
  with check (
    bucket_id = 'event-resources'
    and (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and (storage.foldername(name))[1] = public.current_admin_id()::text
      )
    )
  );

create policy "tenant reads resource files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'event-resources'
    and (select private.current_actor_is_active())
    and exists (
      select 1
      from public.event_resources resource
      where resource.storage_path = storage.objects.name
    )
  );
