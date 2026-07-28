do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'deals_id_admin_id_key'
      and conrelid = 'public.deals'::regclass
  ) then
    alter table public.deals
      add constraint deals_id_admin_id_key unique (id, admin_id);
  end if;
end
$$;

create table public.mou_documents (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null unique,
  admin_id uuid not null
    references public.admin_tenants(id) on update cascade on delete cascade,
  uploaded_by uuid not null
    references public.user_profiles(id) on update cascade on delete restrict,
  file_name text not null
    check (
      char_length(file_name) between 5 and 160
      and lower(file_name) like '%.pdf'
    ),
  storage_path text not null unique,
  mime_type text not null default 'application/pdf'
    check (mime_type = 'application/pdf'),
  file_size bigint not null
    check (file_size between 1 and 10485760),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mou_documents_deal_tenant_fkey
    foreign key (deal_id, admin_id)
    references public.deals(id, admin_id)
    on update cascade
    on delete cascade
);

comment on table public.mou_documents is
  'The authoritative private PDF attached to an Admin-managed MOU deal.';
comment on column public.mou_documents.storage_path is
  'Private Storage object path prefixed by Admin tenant and deal UUIDs.';

create index mou_documents_admin_idx
  on public.mou_documents (admin_id);

create trigger touch_mou_documents_updated_at
  before update on public.mou_documents
  for each row execute function public.touch_updated_at();

drop trigger if exists audit_deals on public.deals;
create trigger audit_deals
  after insert or update or delete on public.deals
  for each row execute function private.audit_privileged_change();

create trigger audit_mou_documents
  after insert or update or delete on public.mou_documents
  for each row execute function private.audit_privileged_change();

alter table public.mou_documents enable row level security;

revoke all on public.mou_documents from anon;
revoke all on public.mou_documents from authenticated;
grant select, insert, update, delete
  on public.mou_documents to authenticated;

create policy "mou documents select access"
  on public.mou_documents for select to authenticated
  using (
    (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and admin_id = public.current_admin_id()
      )
      or (
        public.current_app_role() = 'vendor'
        and admin_id = public.current_admin_id()
        and exists (
          select 1
          from public.deals deal
          join public.matches match on match.id = deal.match_id
          where deal.id = mou_documents.deal_id
            and deal.admin_id = mou_documents.admin_id
            and (
              match.delegation_company_id =
                public.current_vendor_company_id()
              or match.partner_company_id =
                public.current_vendor_company_id()
            )
        )
      )
    )
  );

create policy "admin inserts mou documents"
  on public.mou_documents for insert to authenticated
  with check (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'admin'
    and admin_id = public.current_admin_id()
    and uploaded_by = (select auth.uid())
    and exists (
      select 1
      from public.deals deal
      where deal.id = mou_documents.deal_id
        and deal.admin_id = public.current_admin_id()
    )
  );

create policy "admin updates mou documents"
  on public.mou_documents for update to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'admin'
    and admin_id = public.current_admin_id()
  )
  with check (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'admin'
    and admin_id = public.current_admin_id()
    and uploaded_by = (select auth.uid())
  );

create policy "admin deletes mou documents"
  on public.mou_documents for delete to authenticated
  using (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'admin'
    and admin_id = public.current_admin_id()
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'mou-documents',
  'mou-documents',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "admin uploads mou document files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'mou-documents'
    and (select private.current_actor_is_active())
    and public.current_app_role() = 'admin'
    and (storage.foldername(name))[1] = public.current_admin_id()::text
  );

create policy "mou document files select access"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'mou-documents'
    and (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and (storage.foldername(name))[1] = public.current_admin_id()::text
      )
      or (
        public.current_app_role() = 'vendor'
        and exists (
          select 1
          from public.mou_documents document
          join public.deals deal on deal.id = document.deal_id
          join public.matches match on match.id = deal.match_id
          where document.storage_path = storage.objects.name
            and document.admin_id = public.current_admin_id()
            and (
              match.delegation_company_id =
                public.current_vendor_company_id()
              or match.partner_company_id =
                public.current_vendor_company_id()
            )
        )
      )
    )
  );

create policy "admin deletes mou document files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'mou-documents'
    and (select private.current_actor_is_active())
    and public.current_app_role() = 'admin'
    and (storage.foldername(name))[1] = public.current_admin_id()::text
  );
