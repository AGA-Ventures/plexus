create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target text not null check (target in ('all', 'delegation', 'partner', 'admin')),
  channel text not null check (channel in ('email', 'notification', 'both')),
  status text not null check (status in ('Draft', 'Queued', 'Sent')),
  sent_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('Agenda', 'Map', 'Briefing', 'Logistics', 'Other')),
  file_name text not null,
  file_url text not null,
  storage_path text,
  audience text not null check (audience in ('all', 'delegation', 'partner', 'admin')),
  visible_to_delegation boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger touch_announcements_updated_at
  before update on public.announcements
  for each row execute function public.touch_updated_at();

create or replace trigger touch_event_resources_updated_at
  before update on public.event_resources
  for each row execute function public.touch_updated_at();

create index if not exists announcements_target_idx on public.announcements(target);
create index if not exists announcements_status_idx on public.announcements(status);
create index if not exists event_resources_audience_idx on public.event_resources(audience);
create index if not exists event_resources_visible_to_delegation_idx
  on public.event_resources(visible_to_delegation);
create index if not exists event_resources_storage_path_idx
  on public.event_resources(storage_path)
  where storage_path is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-resources',
  'event-resources',
  false,
  15728640,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.announcements enable row level security;
alter table public.event_resources enable row level security;

drop policy if exists "admin manages announcements" on public.announcements;
drop policy if exists "authenticated reads relevant announcements" on public.announcements;
drop policy if exists "admin manages event resources" on public.event_resources;
drop policy if exists "authenticated reads relevant event resources" on public.event_resources;
drop policy if exists "admin manages event resource files" on storage.objects;
drop policy if exists "authenticated reads event resource files" on storage.objects;

create policy "admin manages announcements"
  on public.announcements for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "authenticated reads relevant announcements"
  on public.announcements for select to authenticated
  using (
    target = 'all'
    or target = public.current_app_role()
    or public.current_app_role() = 'admin'
  );

create policy "admin manages event resources"
  on public.event_resources for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

create policy "authenticated reads relevant event resources"
  on public.event_resources for select to authenticated
  using (
    audience = 'all'
    or audience = public.current_app_role()
    or public.current_app_role() = 'admin'
  );

create policy "admin manages event resource files"
  on storage.objects for all to authenticated
  using (bucket_id = 'event-resources' and public.current_app_role() = 'admin')
  with check (bucket_id = 'event-resources' and public.current_app_role() = 'admin');

create policy "authenticated reads event resource files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'event-resources'
    and exists (
      select 1
      from public.event_resources
      where storage_path = storage.objects.name
        and (
          audience = 'all'
          or audience = public.current_app_role()
          or public.current_app_role() = 'admin'
        )
    )
  );

revoke all on public.announcements from anon;
revoke all on public.event_resources from anon;
revoke all on public.announcements from authenticated;
revoke all on public.event_resources from authenticated;

grant select, insert, update, delete on public.announcements to authenticated;
grant select, insert, update, delete on public.event_resources to authenticated;
