-- Interpreter roster managed by admins; readable by all authenticated roles so
-- delegation/partner requesters can optionally pick a preferred interpreter when
-- requesting a meeting. The selected interpreter is stored on the meeting as a
-- preference that admins confirm or override.

create table if not exists public.interpreters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  languages text not null,
  email text not null default '',
  notes text not null default '',
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meetings
  add column if not exists requested_interpreter_id uuid
  references public.interpreters(id) on delete set null;

create or replace trigger touch_interpreters_updated_at
  before update on public.interpreters
  for each row execute function public.touch_updated_at();

create index if not exists interpreters_available_idx on public.interpreters(available);
create index if not exists meetings_requested_interpreter_id_idx
  on public.meetings(requested_interpreter_id)
  where requested_interpreter_id is not null;

alter table public.interpreters enable row level security;

drop policy if exists "admin manages interpreters" on public.interpreters;
drop policy if exists "authenticated reads interpreters" on public.interpreters;

create policy "admin manages interpreters"
  on public.interpreters for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "authenticated reads interpreters"
  on public.interpreters for select to authenticated
  using (public.current_app_role() in ('admin', 'delegation', 'partner'));

revoke all on public.interpreters from anon;
revoke all on public.interpreters from authenticated;

grant select, insert, update, delete on public.interpreters to authenticated;

-- Allow delegation/partner companies to request (insert) and re-request (update)
-- a meeting for a match they own. This is required for the meeting-request flow
-- (including the optional interpreter preference) to work without elevated
-- service-role access. Admins keep their existing full-management policies.
drop policy if exists "requester inserts own meetings" on public.meetings;
drop policy if exists "requester updates own meetings" on public.meetings;

create policy "requester inserts own meetings"
  on public.meetings for insert to authenticated
  with check (
    exists (
      select 1 from public.matches
      where matches.id = meetings.match_id
      and (
        (public.current_app_role() = 'delegation'
          and matches.delegation_company_id = public.current_delegation_company_id())
        or (public.current_app_role() = 'partner'
          and matches.partner_company_id = public.current_partner_company_id())
      )
    )
  );

create policy "requester updates own meetings"
  on public.meetings for update to authenticated
  using (
    exists (
      select 1 from public.matches
      where matches.id = meetings.match_id
      and (
        (public.current_app_role() = 'delegation'
          and matches.delegation_company_id = public.current_delegation_company_id())
        or (public.current_app_role() = 'partner'
          and matches.partner_company_id = public.current_partner_company_id())
      )
    )
  )
  with check (
    exists (
      select 1 from public.matches
      where matches.id = meetings.match_id
      and (
        (public.current_app_role() = 'delegation'
          and matches.delegation_company_id = public.current_delegation_company_id())
        or (public.current_app_role() = 'partner'
          and matches.partner_company_id = public.current_partner_company_id())
      )
    )
  );

insert into public.interpreters (id, name, languages, email, notes, available)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'Grace Wong',
    'EN ⇄ ZH',
    'grace.wong@plexusconnect.example',
    'Senior conference interpreter. Strong on smart-mobility and EV terminology.',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Lee Wei',
    'ZH ⇄ EN',
    'lee.wei@plexusconnect.example',
    'Specialises in agri-tech and manufacturing site visits.',
    true
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Nurul Aisyah',
    'EN ⇄ MS ⇄ ZH',
    'nurul.aisyah@plexusconnect.example',
    'Trilingual; available for Malaysia-side government liaison sessions.',
    true
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Daniel Tan',
    'ZH ⇄ EN',
    'daniel.tan@plexusconnect.example',
    'Reserve interpreter. Currently unavailable until further notice.',
    false
  )
on conflict (id) do update set
  name = excluded.name,
  languages = excluded.languages,
  email = excluded.email,
  notes = excluded.notes,
  available = excluded.available;
