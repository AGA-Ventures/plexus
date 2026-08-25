create or replace function private.protect_mou_signature_evidence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  match_row public.matches%rowtype;
  valid_signature boolean := false;
begin
  if new.delegation_signed_at is not distinct from old.delegation_signed_at
    and new.delegation_signed_by is not distinct from old.delegation_signed_by
    and new.partner_signed_at is not distinct from old.partner_signed_at
    and new.partner_signed_by is not distinct from old.partner_signed_by
  then
    return new;
  end if;

  if not (select private.current_actor_is_active())
    or public.current_app_role() <> 'vendor'
  then
    raise exception using
      errcode = '42501',
      message = 'Vendor MOU signature evidence is append-only';
  end if;

  select match.*
  into match_row
  from public.matches match
  where match.id = old.match_id
    and match.admin_id = old.admin_id;

  if public.current_vendor_type() = 'delegation'
    and match_row.delegation_company_id =
      public.current_vendor_company_id()
    and old.delegation_signed_at is null
    and old.delegation_signed_by is null
    and new.delegation_signed_at is not null
    and new.delegation_signed_by = (select auth.uid())
    and new.partner_signed_at is not distinct from old.partner_signed_at
    and new.partner_signed_by is not distinct from old.partner_signed_by
  then
    valid_signature := true;
  elsif public.current_vendor_type() = 'partner'
    and match_row.partner_company_id =
      public.current_vendor_company_id()
    and old.partner_signed_at is null
    and old.partner_signed_by is null
    and new.partner_signed_at is not null
    and new.partner_signed_by = (select auth.uid())
    and new.delegation_signed_at is not distinct from
      old.delegation_signed_at
    and new.delegation_signed_by is not distinct from
      old.delegation_signed_by
  then
    valid_signature := true;
  end if;

  if not valid_signature
    or not exists (
      select 1
      from public.meetings meeting
      where meeting.match_id = old.match_id
        and meeting.admin_id = old.admin_id
        and meeting.status = 'Completed'
    )
  then
    raise exception using
      errcode = '42501',
      message = 'Vendor MOU signature evidence is append-only';
  end if;

  return new;
end
$$;

revoke all
  on function private.protect_mou_signature_evidence()
  from public;
revoke all
  on function private.protect_mou_signature_evidence()
  from anon;
revoke all
  on function private.protect_mou_signature_evidence()
  from authenticated;

drop trigger if exists protect_mou_signature_evidence
  on public.deals;
create trigger protect_mou_signature_evidence
  before update on public.deals
  for each row execute function private.protect_mou_signature_evidence();
