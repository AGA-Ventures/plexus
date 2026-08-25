-- PostgreSQL evaluates CHECK-constraint helper functions as the row-changing
-- role. This immutable validator exposes no data; authenticated/service writes
-- need EXECUTE so valid tenant profile updates can pass the constraint.
grant execute
  on function private.valid_meeting_availability(jsonb)
  to authenticated, service_role;
