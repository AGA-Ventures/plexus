create or replace function private.sync_mou_document_label()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    update public.deals
    set document = 'Pending upload'
    where id = old.deal_id
      and admin_id = old.admin_id;

    return old;
  end if;

  update public.deals
  set document = new.file_name
  where id = new.deal_id
    and admin_id = new.admin_id;

  return new;
end
$$;

revoke all on function private.sync_mou_document_label() from public;
revoke all on function private.sync_mou_document_label() from anon;
revoke all on function private.sync_mou_document_label() from authenticated;

create trigger sync_mou_document_label
  after insert or update of file_name on public.mou_documents
  for each row execute function private.sync_mou_document_label();

create trigger clear_mou_document_label
  after delete on public.mou_documents
  for each row execute function private.sync_mou_document_label();
