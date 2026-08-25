create index deals_delegation_signed_by_idx
  on public.deals (delegation_signed_by);

create index deals_partner_signed_by_idx
  on public.deals (partner_signed_by);
