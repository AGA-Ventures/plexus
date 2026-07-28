create table public.vendor_profile_documents (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null
    references public.admin_tenants(id) on update cascade on delete cascade,
  vendor_company_id uuid not null,
  vendor_type text not null
    check (vendor_type in ('delegation', 'partner')),
  uploaded_by uuid not null
    references public.user_profiles(id) on update cascade on delete restrict,
  file_name text not null
    check (char_length(file_name) between 5 and 160),
  storage_path text not null unique,
  mime_type text not null default 'application/pdf'
    check (mime_type = 'application/pdf'),
  file_size bigint not null
    check (file_size between 1 and 6291456),
  created_at timestamptz not null default now(),
  constraint vendor_profile_documents_vendor_tenant_fkey
    foreign key (vendor_company_id, admin_id)
    references public.vendor_companies(id, admin_id)
    on update cascade
    on delete cascade,
  constraint vendor_profile_documents_vendor_type_fkey
    foreign key (vendor_company_id, vendor_type)
    references public.vendor_companies(id, vendor_type)
    on update cascade
    on delete cascade
);

comment on table public.vendor_profile_documents is
  'Private PDF metadata for a Vendor company registration profile.';
comment on column public.vendor_profile_documents.storage_path is
  'Private Storage object path prefixed by Admin tenant and Vendor company UUIDs.';

create index vendor_profile_documents_company_created_idx
  on public.vendor_profile_documents (vendor_company_id, created_at desc);
create index vendor_profile_documents_admin_idx
  on public.vendor_profile_documents (admin_id);

alter table public.vendor_profile_documents enable row level security;

revoke all on public.vendor_profile_documents from anon;
revoke all on public.vendor_profile_documents from authenticated;
grant select, insert, delete
  on public.vendor_profile_documents to authenticated;

create policy "profile documents select access"
  on public.vendor_profile_documents for select to authenticated
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
        and vendor_company_id = public.current_vendor_company_id()
        and vendor_type = public.current_vendor_type()
      )
    )
  );

create policy "vendor uploads own profile documents"
  on public.vendor_profile_documents for insert to authenticated
  with check (
    (select private.current_actor_is_active())
    and public.current_app_role() = 'vendor'
    and admin_id = public.current_admin_id()
    and vendor_company_id = public.current_vendor_company_id()
    and vendor_type = public.current_vendor_type()
    and uploaded_by = (select auth.uid())
  );

create policy "profile documents delete access"
  on public.vendor_profile_documents for delete to authenticated
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
        and vendor_company_id = public.current_vendor_company_id()
        and vendor_type = public.current_vendor_type()
      )
    )
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'vendor-profile-documents',
  'vendor-profile-documents',
  false,
  6291456,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "vendor uploads own profile document files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vendor-profile-documents'
    and (select private.current_actor_is_active())
    and public.current_app_role() = 'vendor'
    and (storage.foldername(name))[1] = public.current_admin_id()::text
    and (storage.foldername(name))[2] = public.current_vendor_company_id()::text
  );

create policy "profile document files select access"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'vendor-profile-documents'
    and (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and (storage.foldername(name))[1] = public.current_admin_id()::text
      )
      or (
        public.current_app_role() = 'vendor'
        and (storage.foldername(name))[1] = public.current_admin_id()::text
        and (storage.foldername(name))[2] =
          public.current_vendor_company_id()::text
      )
    )
  );

create policy "profile document files delete access"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'vendor-profile-documents'
    and (select private.current_actor_is_active())
    and (
      public.current_app_role() = 'superadmin'
      or (
        public.current_app_role() = 'admin'
        and (storage.foldername(name))[1] = public.current_admin_id()::text
      )
      or (
        public.current_app_role() = 'vendor'
        and (storage.foldername(name))[1] = public.current_admin_id()::text
        and (storage.foldername(name))[2] =
          public.current_vendor_company_id()::text
      )
    )
  );
