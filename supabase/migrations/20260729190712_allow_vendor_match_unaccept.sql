-- A Vendor may withdraw only its own one-sided acceptance. Once the other
-- Vendor accepts or a meeting exists for the match, the decision is locked.
-- The match row update lock serializes a withdrawal racing the second
-- acceptance so both operations cannot succeed against the same state.
create or replace function private.enforce_mutual_match_decision()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor_role text := public.current_app_role();
  actor_vendor_id uuid := public.current_vendor_company_id();
  actor_vendor_type text := public.current_vendor_type();
  meeting_exists boolean;
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
        message = 'Vendors can only record their own match acceptance';
    end if;

    if new.status = 'Rejected' then
      raise exception using
        errcode = '42501',
        message = 'Vendors cannot reject or request changes to a match';
    end if;

    meeting_exists := exists (
      select 1
      from public.meetings
      where meetings.match_id = old.id
        and meetings.admin_id = old.admin_id
    );

    if actor_vendor_type = 'delegation'
      and actor_vendor_id = old.delegation_company_id
    then
      if old.partner_accepted_at is distinct from new.partner_accepted_at then
        raise exception using
          errcode = '42501',
          message = 'A Delegation cannot decide for the Partner';
      end if;

      if old.delegation_accepted_at is not null
        and new.delegation_accepted_at is null
      then
        if old.partner_accepted_at is not null then
          raise exception using
            errcode = '42501',
            message = 'Acceptance cannot be withdrawn after the other Vendor accepts';
        end if;

        if meeting_exists then
          raise exception using
            errcode = '42501',
            message = 'Acceptance cannot be withdrawn after a meeting is arranged';
        end if;

        new.status := 'Proposed';
      elsif old.delegation_accepted_at is not null
        and new.delegation_accepted_at is not null
        and old.delegation_accepted_at is distinct from new.delegation_accepted_at
      then
        raise exception using
          errcode = '42501',
          message = 'Vendor acceptance cannot be rewritten';
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
          message = 'Record a Delegation acceptance instead of changing match status directly';
      end if;
    elsif actor_vendor_type = 'partner'
      and actor_vendor_id = old.partner_company_id
    then
      if old.delegation_accepted_at is distinct from new.delegation_accepted_at then
        raise exception using
          errcode = '42501',
          message = 'A Partner cannot decide for the Delegation';
      end if;

      if old.partner_accepted_at is not null
        and new.partner_accepted_at is null
      then
        if old.delegation_accepted_at is not null then
          raise exception using
            errcode = '42501',
            message = 'Acceptance cannot be withdrawn after the other Vendor accepts';
        end if;

        if meeting_exists then
          raise exception using
            errcode = '42501',
            message = 'Acceptance cannot be withdrawn after a meeting is arranged';
        end if;

        new.status := 'Proposed';
      elsif old.partner_accepted_at is not null
        and new.partner_accepted_at is not null
        and old.partner_accepted_at is distinct from new.partner_accepted_at
      then
        raise exception using
          errcode = '42501',
          message = 'Vendor acceptance cannot be rewritten';
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
          message = 'Record a Partner acceptance instead of changing match status directly';
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
