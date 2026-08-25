update public.deals
set signatory_check = 'Verified'
where status = 'Signed'
  and delegation_signed_at is not null
  and partner_signed_at is not null
  and signatory_check <> 'Verified';
