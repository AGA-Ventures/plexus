create or replace function private.valid_meeting_availability(
  value jsonb
)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select
    jsonb_typeof(value) = 'object'
    and not exists (
      select 1
      from jsonb_each(value) as day_config(day_key, day_slots)
      where day_key not in ('1', '2', '3', '4', '5')
        or jsonb_typeof(day_slots) <> 'array'
        or exists (
          select 1
          from jsonb_array_elements_text(
            case
              when jsonb_typeof(day_slots) = 'array' then day_slots
              else '[]'::jsonb
            end
          ) as slot(slot_time)
          where slot_time not in (
            '09:00',
            '10:00',
            '11:00',
            '14:00',
            '15:00',
            '16:00'
          )
        )
    )
$$;

revoke all on function private.valid_meeting_availability(jsonb) from public;
revoke all on function private.valid_meeting_availability(jsonb) from anon;
revoke all on function private.valid_meeting_availability(jsonb) from authenticated;

alter table public.admin_tenants
  add column if not exists meeting_availability jsonb not null default
    '{
      "1": ["10:00", "11:00", "14:00", "15:00"],
      "2": ["10:00", "11:00", "14:00", "15:00"],
      "3": ["10:00", "11:00", "14:00", "15:00"],
      "4": ["10:00", "11:00", "14:00", "15:00"],
      "5": ["10:00", "11:00", "14:00", "15:00"]
    }'::jsonb;

alter table public.admin_tenants
  drop constraint if exists admin_tenants_meeting_availability_check;

alter table public.admin_tenants
  add constraint admin_tenants_meeting_availability_check
  check (private.valid_meeting_availability(meeting_availability));

comment on column public.admin_tenants.meeting_availability is
  'Tenant-controlled recurring weekday and one-hour time slots offered to Vendors when both sides of a match have accepted.';
