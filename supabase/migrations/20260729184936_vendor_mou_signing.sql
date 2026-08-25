alter table public.deals
  add column delegation_signed_at timestamptz,
  add column delegation_signed_by uuid
    references public.user_profiles(id) on delete set null,
  add column partner_signed_at timestamptz,
  add column partner_signed_by uuid
    references public.user_profiles(id) on delete set null;

comment on column public.deals.delegation_signed_at is
  'Time the matched Delegation Vendor explicitly accepted this MOU.';
comment on column public.deals.delegation_signed_by is
  'Authenticated Delegation Vendor account that accepted this MOU.';
comment on column public.deals.partner_signed_at is
  'Time the matched Partner Vendor explicitly accepted this MOU.';
comment on column public.deals.partner_signed_by is
  'Authenticated Partner Vendor account that accepted this MOU.';

-- Preserve the meaning of legacy Signed rows while making future Signed status
-- dependent on both Vendor acceptances.
update public.deals
set
  delegation_signed_at = coalesce(delegation_signed_at, updated_at, now()),
  partner_signed_at = coalesce(partner_signed_at, updated_at, now())
where status = 'Signed';

alter table public.deals
  add constraint deals_signed_requires_both_vendor_signatures
  check (
    status <> 'Signed'
    or (
      delegation_signed_at is not null
      and partner_signed_at is not null
    )
  ),
  add constraint deals_both_vendor_signatures_require_signed_status
  check (
    delegation_signed_at is null
    or partner_signed_at is null
    or status = 'Signed'
  );

create or replace function public.complete_meeting_with_mou(
  p_meeting_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  meeting_row public.meetings%rowtype;
begin
  if not (select private.current_actor_is_active())
    or public.current_app_role() not in ('admin', 'superadmin')
  then
    raise exception using
      errcode = '42501',
      message = 'Only an active Admin can complete a meeting';
  end if;

  select meeting.*
  into meeting_row
  from public.meetings meeting
  where meeting.id = p_meeting_id
    and (
      public.current_app_role() = 'superadmin'
      or meeting.admin_id = public.current_admin_id()
    )
  for update;

  if meeting_row.id is null then
    raise exception using
      errcode = '42501',
      message = 'Meeting not found in the active Admin tenant';
  end if;

  update public.meetings
  set
    status = 'Completed',
    summary =
      'Admin summary saved: both parties requested September follow-up.'
  where id = meeting_row.id;

  insert into public.deals (
    match_id,
    admin_id,
    status,
    document,
    signatory_check
  )
  values (
    meeting_row.match_id,
    meeting_row.admin_id,
    'Under Discussion',
    'Pending upload',
    'Pending'
  )
  on conflict (match_id) do nothing;

  return true;
end
$$;

revoke all on function public.complete_meeting_with_mou(uuid) from public;
revoke all on function public.complete_meeting_with_mou(uuid) from anon;
grant execute
  on function public.complete_meeting_with_mou(uuid)
  to authenticated;

create or replace function public.sign_vendor_mou(
  p_deal_id uuid,
  p_agreed boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  deal_row public.deals%rowtype;
  match_row public.matches%rowtype;
  signing_party text;
  resulting_status text;
begin
  if p_agreed is not true then
    raise exception using
      errcode = '22023',
      message = 'Confirm the MOU agreement before signing';
  end if;

  if not (select private.current_actor_is_active())
    or public.current_app_role() <> 'vendor'
  then
    raise exception using
      errcode = '42501',
      message = 'Only an active Vendor can sign an MOU';
  end if;

  select deal.*
  into deal_row
  from public.deals deal
  where deal.id = p_deal_id
    and deal.admin_id = public.current_admin_id()
  for update;

  if deal_row.id is null then
    raise exception using
      errcode = '42501',
      message = 'MOU not found in the active Vendor tenant';
  end if;

  select match.*
  into match_row
  from public.matches match
  where match.id = deal_row.match_id
    and match.admin_id = deal_row.admin_id;

  if public.current_vendor_type() = 'delegation'
    and match_row.delegation_company_id =
      public.current_vendor_company_id()
  then
    signing_party := 'delegation';
  elsif public.current_vendor_type() = 'partner'
    and match_row.partner_company_id =
      public.current_vendor_company_id()
  then
    signing_party := 'partner';
  else
    raise exception using
      errcode = '42501',
      message = 'This Vendor is not a party to the MOU';
  end if;

  if not exists (
    select 1
    from public.meetings meeting
    where meeting.match_id = deal_row.match_id
      and meeting.admin_id = deal_row.admin_id
      and meeting.status = 'Completed'
  ) then
    raise exception using
      errcode = '23514',
      message = 'The matched meeting must be completed before signing';
  end if;

  if signing_party = 'delegation' then
    update public.deals
    set
      delegation_signed_at =
        coalesce(delegation_signed_at, statement_timestamp()),
      delegation_signed_by =
        coalesce(delegation_signed_by, (select auth.uid())),
      status = case
        when partner_signed_at is not null then 'Signed'
        else 'Agreement Reached'
      end,
      signatory_check = case
        when partner_signed_at is not null then 'Verified'
        else 'Pending'
      end
    where id = deal_row.id;
  else
    update public.deals
    set
      partner_signed_at =
        coalesce(partner_signed_at, statement_timestamp()),
      partner_signed_by =
        coalesce(partner_signed_by, (select auth.uid())),
      status = case
        when delegation_signed_at is not null then 'Signed'
        else 'Agreement Reached'
      end,
      signatory_check = case
        when delegation_signed_at is not null then 'Verified'
        else 'Pending'
      end
    where id = deal_row.id;
  end if;

  select deal.status
  into resulting_status
  from public.deals deal
  where deal.id = deal_row.id;

  return resulting_status;
end
$$;

revoke all on function public.sign_vendor_mou(uuid, boolean) from public;
revoke all on function public.sign_vendor_mou(uuid, boolean) from anon;
grant execute
  on function public.sign_vendor_mou(uuid, boolean)
  to authenticated;

-- Existing completed meetings gain their one pending MOU immediately.
insert into public.deals (
  match_id,
  admin_id,
  status,
  document,
  signatory_check
)
select distinct on (meeting.match_id)
  meeting.match_id,
  meeting.admin_id,
  'Under Discussion',
  'Pending upload',
  'Pending'
from public.meetings meeting
where meeting.status = 'Completed'
order by meeting.match_id, meeting.created_at desc
on conflict (match_id) do nothing;
