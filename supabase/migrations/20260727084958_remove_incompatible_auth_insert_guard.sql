-- Supabase GoTrue writes confirmation and custom app_metadata after its initial
-- auth.users INSERT, so an INSERT trigger cannot distinguish the supported
-- Auth Admin API from a public signup. Production public signup is disabled in
-- Auth configuration; trusted server provisioning, profile binding validation,
-- and RLS remain the enforcement layers.
drop trigger if exists enforce_plexus_auth_provisioning
  on auth.users;
drop function if exists private.reject_unprovisioned_auth_user();
