-- A match becomes accepted only after both participating Vendors record their
-- own decision. Existing accepted/scheduled rows are grandfathered so this
-- migration does not break meetings that were already in progress.
alter table public.matches
  add column if not exists delegation_accepted_at timestamptz,
  add column if not exists partner_accepted_at timestamptz;

update public.matches
set
  delegation_accepted_at = coalesce(delegation_accepted_at, updated_at, created_at),
  partner_accepted_at = coalesce(partner_accepted_at, updated_at, created_at)
where status in ('Accepted', 'Session Scheduled');

alter table public.matches
  drop constraint if exists matches_mutual_acceptance_check;
alter table public.matches
  add constraint matches_mutual_acceptance_check
  check (
    status not in ('Accepted', 'Session Scheduled')
    or (
      delegation_accepted_at is not null
      and partner_accepted_at is not null
    )
  );

create or replace function private.enforce_mutual_match_decision()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor_role text := public.current_app_role();
  actor_vendor_id uuid := public.current_vendor_company_id();
  actor_vendor_type text := public.current_vendor_type();
begin
  if tg_op = 'INSERT'
    and actor_role in ('superadmin', 'admin', 'vendor')
    and (
      new.delegation_accepted_at is not null
      or new.partner_accepted_at is not null
    )
  then
    raise exception using
      errcode = '42501',
      message = 'Match acceptance must be recorded by each Vendor after creation';
  end if;

  if tg_op = 'UPDATE' and actor_role = 'vendor' then
    if not (select private.current_actor_is_active()) then
      raise exception using
        errcode = '42501',
        message = 'Only an active Vendor can decide a match';
    end if;

    if (
      old.id is distinct from new.id
      or old.admin_id is distinct from new.admin_id
      or old.delegation_company_id is distinct from new.delegation_company_id
      or old.partner_company_id is distinct from new.partner_company_id
      or old.score is distinct from new.score
      or old.note is distinct from new.note
      or old.created_at is distinct from new.created_at
    ) then
      raise exception using
        errcode = '42501',
        message = 'Vendors can only record their own match decision';
    end if;

    if actor_vendor_type = 'delegation'
      and actor_vendor_id = old.delegation_company_id
    then
      if old.partner_accepted_at is distinct from new.partner_accepted_at then
        raise exception using
          errcode = '42501',
          message = 'A Delegation cannot decide for the Partner';
      end if;

      if new.status = 'Rejected' then
        new.delegation_accepted_at := null;
      elsif old.delegation_accepted_at is distinct from new.delegation_accepted_at then
        new.status := case
          when new.delegation_accepted_at is not null
            and new.partner_accepted_at is not null
          then 'Accepted'
          else 'Proposed'
        end;
      elsif old.status is distinct from new.status then
        raise exception using
          errcode = '42501',
          message = 'Record a Delegation decision instead of changing match status directly';
      end if;
    elsif actor_vendor_type = 'partner'
      and actor_vendor_id = old.partner_company_id
    then
      if old.delegation_accepted_at is distinct from new.delegation_accepted_at then
        raise exception using
          errcode = '42501',
          message = 'A Partner cannot decide for the Delegation';
      end if;

      if new.status = 'Rejected' then
        new.partner_accepted_at := null;
      elsif old.partner_accepted_at is distinct from new.partner_accepted_at then
        new.status := case
          when new.delegation_accepted_at is not null
            and new.partner_accepted_at is not null
          then 'Accepted'
          else 'Proposed'
        end;
      elsif old.status is distinct from new.status then
        raise exception using
          errcode = '42501',
          message = 'Record a Partner decision instead of changing match status directly';
      end if;
    else
      raise exception using
        errcode = '42501',
        message = 'This Vendor does not participate in the match';
    end if;
  elsif tg_op = 'UPDATE' and actor_role in ('superadmin', 'admin') then
    if old.status is distinct from new.status
      and new.status in ('Accepted', 'Session Scheduled')
    then
      raise exception using
        errcode = '42501',
        message = 'Use the Vendor decision or trusted meeting workflow to advance a match';
    end if;

    if (
      (
        old.delegation_accepted_at is distinct from new.delegation_accepted_at
        and new.delegation_accepted_at is not null
      )
      or (
        old.partner_accepted_at is distinct from new.partner_accepted_at
        and new.partner_accepted_at is not null
      )
    ) then
      raise exception using
        errcode = '42501',
        message = 'Admins cannot accept a match on behalf of a Vendor';
    end if;
  end if;

  if new.status in ('Accepted', 'Session Scheduled')
    and (
      new.delegation_accepted_at is null
      or new.partner_accepted_at is null
    )
  then
    raise exception using
      errcode = '42501',
      message = 'Both Vendors must accept before the match can advance';
  end if;

  return new;
end
$$;

revoke all on function private.enforce_mutual_match_decision() from public;
revoke all on function private.enforce_mutual_match_decision() from anon;
revoke all on function private.enforce_mutual_match_decision() from authenticated;

drop trigger if exists enforce_mutual_match_decision on public.matches;
create trigger enforce_mutual_match_decision
  before insert or update on public.matches
  for each row execute function private.enforce_mutual_match_decision();

-- Preserve legacy VooV rows while enabling new Zoom and Lark provider-backed
-- meetings. New application code creates only Zoom or Lark rows.
alter table public.meetings
  drop constraint if exists meetings_platform_check;
alter table public.meetings
  add constraint meetings_platform_check
  check (platform in ('Pending', 'Zoom', 'Lark', 'VooV'));

-- Lark's refresh token is server-only. RLS is enabled and there are
-- deliberately no anon/authenticated policies.
create table if not exists public.oauth_tokens (
  id text primary key,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.oauth_tokens enable row level security;

revoke all on public.oauth_tokens from public;
revoke all on public.oauth_tokens from anon;
revoke all on public.oauth_tokens from authenticated;
grant select, insert, update, delete on public.oauth_tokens to service_role;

-- Keep the real provider URL in a separate locked table. The existing
-- public.meetings.link column contains only the wrapped /m/<slug> URL.
create table if not exists public.meeting_provider_links (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid unique not null
    references public.meetings(id) on delete cascade,
  slug text unique not null check (length(slug) >= 32),
  provider text not null check (provider in ('zoom', 'lark')),
  topic text,
  join_url text not null check (join_url ~ '^https://'),
  provider_meeting_id text,
  available_at timestamptz not null,
  expires_at timestamptz not null,
  open_count integer not null default 0 check (open_count >= 0),
  max_opens integer not null default 10 check (max_opens > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > available_at)
);

alter table public.meeting_provider_links enable row level security;

revoke all on public.meeting_provider_links from public;
revoke all on public.meeting_provider_links from anon;
revoke all on public.meeting_provider_links from authenticated;
grant select, insert, update, delete on public.meeting_provider_links to service_role;

create index if not exists meeting_provider_links_expires_at_idx
  on public.meeting_provider_links(expires_at);

drop trigger if exists touch_meeting_provider_links_updated_at
  on public.meeting_provider_links;
create trigger touch_meeting_provider_links_updated_at
  before update on public.meeting_provider_links
  for each row execute function public.touch_updated_at();
