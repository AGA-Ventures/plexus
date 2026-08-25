create index meeting_proposals_requested_by_vendor_company_idx
  on public.meeting_proposals (requested_by_vendor_company_id);

create index meeting_proposals_delegation_approved_by_idx
  on public.meeting_proposals (delegation_approved_by);

create index meeting_proposals_partner_approved_by_idx
  on public.meeting_proposals (partner_approved_by);
