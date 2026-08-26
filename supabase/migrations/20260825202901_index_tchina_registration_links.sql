-- Cover nullable account-link foreign keys used by delegate finalization and cleanup.
create index event_registrations_vendor_company_id_idx
  on public.event_registrations(vendor_company_id)
  where vendor_company_id is not null;

create index event_registrations_auth_user_id_idx
  on public.event_registrations(auth_user_id)
  where auth_user_id is not null;
