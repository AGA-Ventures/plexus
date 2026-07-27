-- Self-service match discovery for delegation/partner portals.
--
-- Requesters can browse the *counterpart* side's companies (name + sector only)
-- and propose a match themselves. Two pieces:
--   1. match_candidates(): a SECURITY DEFINER function that returns ONLY
--      id/name/sector of the opposite side, scoped by the caller's JWT role.
--      This deliberately exposes nothing beyond name + sector.
--   2. A requester insert policy on matches so delegation/partner can create a
--      "Proposed" match for their own company (admins keep full management).

create or replace function public.match_candidates()
returns table (id uuid, name_en text, name_cn text, sector text)
language sql
stable
security definer
set search_path = public
as $$
  select pc.id, pc.name_en, pc.name_cn, pc.sector
  from public.partner_companies pc
  where public.current_app_role() = 'delegation'
  union all
  select dc.id, dc.name_en, dc.name_cn, dc.sector
  from public.delegation_companies dc
  where public.current_app_role() = 'partner'
$$;

revoke all on function public.match_candidates() from anon;
revoke all on function public.match_candidates() from public;
grant execute on function public.match_candidates() to authenticated;

drop policy if exists "requester inserts own matches" on public.matches;

create policy "requester inserts own matches"
  on public.matches for insert to authenticated
  with check (
    (public.current_app_role() = 'delegation'
      and delegation_company_id = public.current_delegation_company_id())
    or (public.current_app_role() = 'partner'
      and partner_company_id = public.current_partner_company_id())
  );
