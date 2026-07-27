# Plexus Connect

Supabase-backed multi-tenant operations platform for Malaysia–China/Macao
business matching.

## Workspaces

- `/en/superadmin` — Plexus platform control center across all Admin tenants.
- `/en/admin` — tenant-scoped operations and Vendor management.
- `/en/vendor` — unified end-user workspace for delegation and partner Vendors.
- `/en/login` — shared login that routes users by trusted role.

`/delegation` and `/partner` are compatibility redirects to `/vendor`; they are
Vendor subtypes, not authorization roles. Localized `zh`, `zh-Hant`, and `th`
routes are supported, and `cn` aliases to `zh`.

## Supabase

Copy `.env.example` to `.env.local`. Browser code uses only the URL and
publishable key. Trusted account provisioning additionally requires the
server-only `SUPABASE_SECRET_KEY` (`sb_secret_...`). Never expose it through a
`NEXT_PUBLIC_` variable.

The canonical model and RLS policies live in:

```txt
supabase/migrations/20260727073913_three_tier_tenant_authorization.sql
```

Authorization uses only `app_metadata`:

```json
{ "role": "superadmin" }
```

```json
{ "role": "admin", "admin_id": "<admin-tenant-uuid>" }
```

```json
{
  "role": "vendor",
  "admin_id": "<admin-tenant-uuid>",
  "vendor_company_id": "<vendor-company-uuid>",
  "vendor_type": "delegation"
}
```

The Vendor subtype may be `delegation` or `partner`. Claims must exactly match
an active `user_profiles` row and active tenant/company binding. Invalid or
stale bindings fail closed in login, routes, server actions, and RLS.

Superadmins are never created through public signup or seed SQL. Bootstrap the
first approved operator with the guarded command below, or an Auth Admin API
request that supplies the complete trusted `app_metadata` during user creation.
Then use the Superadmin control center for Admin and Vendor provisioning.

Production public signup must remain disabled in Supabase Auth. Account creation
uses only the server-only Auth Admin API; login, route protection, server
actions, profile bindings, and RLS all reject missing or invalid trusted claims.

With the server secret and approved operator details in `.env.local`, the
trusted one-time bootstrap command is:

```bash
npm run bootstrap:superadmin
```

The command refuses to create another Superadmin by default and never prints
the password.

## Verification

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
```

For authenticated browser tests, configure the `E2E_SUPERADMIN_*`,
`E2E_ADMIN_*`, and `E2E_VENDOR_*` variables documented in `.env.example`.
