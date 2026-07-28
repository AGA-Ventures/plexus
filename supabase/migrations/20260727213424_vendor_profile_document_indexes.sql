create index vendor_profile_documents_vendor_tenant_idx
  on public.vendor_profile_documents (vendor_company_id, admin_id);
create index vendor_profile_documents_vendor_type_idx
  on public.vendor_profile_documents (vendor_company_id, vendor_type);
create index vendor_profile_documents_uploaded_by_idx
  on public.vendor_profile_documents (uploaded_by);
