create or replace function public.current_delegation_company_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select case
    when auth.jwt() -> 'app_metadata' ->> 'delegation_company_id'
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then (auth.jwt() -> 'app_metadata' ->> 'delegation_company_id')::uuid
    else null
  end
$$;

create or replace function public.current_partner_company_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select case
    when auth.jwt() -> 'app_metadata' ->> 'partner_company_id'
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then (auth.jwt() -> 'app_metadata' ->> 'partner_company_id')::uuid
    else null
  end
$$;
