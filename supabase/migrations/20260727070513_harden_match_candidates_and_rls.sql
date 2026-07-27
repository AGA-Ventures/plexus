create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table if not exists public.match_candidate_directory (
  company_type text not null check (company_type in ('delegation', 'partner')),
  id uuid not null,
  name_en text not null,
  name_cn text not null,
  sector text not null,
  primary key (company_type, id)
);

alter table public.match_candidate_directory enable row level security;

revoke all on public.match_candidate_directory from anon;
revoke all on public.match_candidate_directory from authenticated;
grant select on public.match_candidate_directory to authenticated;

drop policy if exists "authenticated reads match candidate directory"
  on public.match_candidate_directory;

create policy "authenticated reads match candidate directory"
  on public.match_candidate_directory for select to authenticated
  using (true);

create or replace function private.sync_match_candidate_directory()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.match_candidate_directory
    where company_type = tg_argv[0]
      and id = old.id;
    return old;
  end if;

  insert into public.match_candidate_directory (
    company_type,
    id,
    name_en,
    name_cn,
    sector
  )
  values (
    tg_argv[0],
    new.id,
    new.name_en,
    new.name_cn,
    new.sector
  )
  on conflict (company_type, id) do update set
    name_en = excluded.name_en,
    name_cn = excluded.name_cn,
    sector = excluded.sector;

  return new;
end;
$$;

revoke all on function private.sync_match_candidate_directory() from public;
revoke all on function private.sync_match_candidate_directory() from anon;
revoke all on function private.sync_match_candidate_directory() from authenticated;

drop trigger if exists sync_delegation_match_candidate_directory
  on public.delegation_companies;
create trigger sync_delegation_match_candidate_directory
  after insert or update or delete on public.delegation_companies
  for each row execute function private.sync_match_candidate_directory('delegation');

drop trigger if exists sync_partner_match_candidate_directory
  on public.partner_companies;
create trigger sync_partner_match_candidate_directory
  after insert or update or delete on public.partner_companies
  for each row execute function private.sync_match_candidate_directory('partner');

delete from public.match_candidate_directory directory
where company_type = 'delegation'
  and not exists (
    select 1 from public.delegation_companies company
    where company.id = directory.id
  );

delete from public.match_candidate_directory directory
where company_type = 'partner'
  and not exists (
    select 1 from public.partner_companies company
    where company.id = directory.id
  );

insert into public.match_candidate_directory (company_type, id, name_en, name_cn, sector)
select 'delegation', id, name_en, name_cn, sector
from public.delegation_companies
on conflict (company_type, id) do update set
  name_en = excluded.name_en,
  name_cn = excluded.name_cn,
  sector = excluded.sector;

insert into public.match_candidate_directory (company_type, id, name_en, name_cn, sector)
select 'partner', id, name_en, name_cn, sector
from public.partner_companies
on conflict (company_type, id) do update set
  name_en = excluded.name_en,
  name_cn = excluded.name_cn,
  sector = excluded.sector;

create or replace function public.match_candidates()
returns table (id uuid, name_en text, name_cn text, sector text)
language sql
stable
security invoker
set search_path = ''
as $$
  select directory.id, directory.name_en, directory.name_cn, directory.sector
  from public.match_candidate_directory directory
  where (select auth.uid()) is not null
    and (
      (public.current_app_role() = 'delegation' and directory.company_type = 'partner')
      or (public.current_app_role() = 'partner' and directory.company_type = 'delegation')
    )
$$;

revoke all on function public.match_candidates() from public;
revoke all on function public.match_candidates() from anon;
grant execute on function public.match_candidates() to authenticated;

drop policy if exists "admin manages announcements" on public.announcements;
drop policy if exists "authenticated reads relevant announcements" on public.announcements;

create policy "admin inserts announcements"
  on public.announcements for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "admin updates announcements"
  on public.announcements for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "admin deletes announcements"
  on public.announcements for delete to authenticated
  using (public.current_app_role() = 'admin');
create policy "authenticated reads relevant announcements"
  on public.announcements for select to authenticated
  using (
    target = 'all'
    or target = public.current_app_role()
    or public.current_app_role() = 'admin'
  );

drop policy if exists "admin manages event resources" on public.event_resources;
drop policy if exists "authenticated reads relevant event resources" on public.event_resources;

create policy "admin inserts event resources"
  on public.event_resources for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "admin updates event resources"
  on public.event_resources for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "admin deletes event resources"
  on public.event_resources for delete to authenticated
  using (public.current_app_role() = 'admin');
create policy "authenticated reads relevant event resources"
  on public.event_resources for select to authenticated
  using (
    audience = 'all'
    or audience = public.current_app_role()
    or public.current_app_role() = 'admin'
  );

drop policy if exists "admin manages interpreters" on public.interpreters;
drop policy if exists "authenticated reads interpreters" on public.interpreters;

create policy "admin inserts interpreters"
  on public.interpreters for insert to authenticated
  with check (public.current_app_role() = 'admin');
create policy "admin updates interpreters"
  on public.interpreters for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
create policy "admin deletes interpreters"
  on public.interpreters for delete to authenticated
  using (public.current_app_role() = 'admin');
create policy "authenticated reads interpreters"
  on public.interpreters for select to authenticated
  using (public.current_app_role() in ('admin', 'delegation', 'partner'));

drop policy if exists "admin inserts matches" on public.matches;
drop policy if exists "requester inserts own matches" on public.matches;

create policy "matches insert access"
  on public.matches for insert to authenticated
  with check (
    public.current_app_role() = 'admin'
    or (public.current_app_role() = 'delegation'
      and delegation_company_id = public.current_delegation_company_id())
    or (public.current_app_role() = 'partner'
      and partner_company_id = public.current_partner_company_id())
  );

drop policy if exists "admin inserts meetings" on public.meetings;
drop policy if exists "requester inserts own meetings" on public.meetings;

create policy "meetings insert access"
  on public.meetings for insert to authenticated
  with check (
    public.current_app_role() = 'admin'
    or exists (
      select 1 from public.matches
      where matches.id = meetings.match_id
      and (
        (public.current_app_role() = 'delegation'
          and matches.delegation_company_id = public.current_delegation_company_id())
        or (public.current_app_role() = 'partner'
          and matches.partner_company_id = public.current_partner_company_id())
      )
    )
  );

drop policy if exists "admin updates meetings" on public.meetings;
drop policy if exists "requester updates own meetings" on public.meetings;

create policy "meetings update access"
  on public.meetings for update to authenticated
  using (
    public.current_app_role() = 'admin'
    or exists (
      select 1 from public.matches
      where matches.id = meetings.match_id
      and (
        (public.current_app_role() = 'delegation'
          and matches.delegation_company_id = public.current_delegation_company_id())
        or (public.current_app_role() = 'partner'
          and matches.partner_company_id = public.current_partner_company_id())
      )
    )
  )
  with check (
    public.current_app_role() = 'admin'
    or exists (
      select 1 from public.matches
      where matches.id = meetings.match_id
      and (
        (public.current_app_role() = 'delegation'
          and matches.delegation_company_id = public.current_delegation_company_id())
        or (public.current_app_role() = 'partner'
          and matches.partner_company_id = public.current_partner_company_id())
      )
    )
  );
