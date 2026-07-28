create index mou_documents_deal_tenant_idx
  on public.mou_documents (deal_id, admin_id);

create index mou_documents_uploaded_by_idx
  on public.mou_documents (uploaded_by);
