alter table public.delegation_companies
  add column if not exists profile_data jsonb not null default '{}'::jsonb;

alter table public.partner_companies
  add column if not exists profile_data jsonb not null default '{}'::jsonb;
