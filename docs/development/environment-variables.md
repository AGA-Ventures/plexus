# Environment Variables

**Owner:** Engineering and operations
**Review trigger:** Environment variable addition, removal, or scope change
**Last reviewed:** 2026-07-27

`.env.example` is the machine-readable variable inventory. This document
explains ownership and scope; it never contains real secrets.

## Application variables

| Variable                               | Browser-visible | Local            | Preview  | Production  | Purpose                                          |
| -------------------------------------- | --------------- | ---------------- | -------- | ----------- | ------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes             | Required         | Required | Required    | Approved Supabase API URL                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes             | Required         | Required | Required    | Public client key; RLS is the boundary           |
| `SUPABASE_SECRET_KEY`                  | No              | Privileged tasks | No       | Required    | Auth Admin API and privileged account operations |
| `NEXT_PUBLIC_SITE_URL`                 | Yes             | Optional         | Optional | Recommended | Canonical public origin for links/metadata       |

## Bootstrap and test variables

| Variable                     | Scope                | Purpose                                     |
| ---------------------------- | -------------------- | ------------------------------------------- |
| `PLEXUS_SUPERADMIN_NAME`     | Local bootstrap only | Approved operator display name              |
| `PLEXUS_SUPERADMIN_EMAIL`    | Local bootstrap only | Approved operator identity                  |
| `PLEXUS_SUPERADMIN_PASSWORD` | Local bootstrap only | One-time initial password                   |
| `E2E_BASE_URL`               | Test process         | Deployed origin for production verification |
| `E2E_SUPERADMIN_*`           | Test process         | Superadmin credential test                  |
| `E2E_ADMIN_*`                | Test process         | Admin credential test                       |
| `E2E_VENDOR_*`               | Test process         | Vendor credential test                      |
| `E2E_VERCEL_BYPASS`          | Test process         | Opt-in protected Vercel deployment bypass   |

## Integration variables

Compliance providers use server-only variables defined by `lib/compliance.ts`.
When a provider becomes production-supported:

1. Document the variable names here and in `.env.example` without values.
2. Scope secrets only to environments that call the provider.
3. Add timeout, retry, failure, and rotation procedures to the runbook.
4. Confirm variables never appear in client bundles, logs, or error messages.

## Rules

- `NEXT_PUBLIC_*` is compiled into browser JavaScript and must not contain a
  secret.
- The publishable Supabase key is intentionally public; RLS protects data.
- `SUPABASE_SECRET_KEY` must never use a `NEXT_PUBLIC_` prefix.
- `.env.local` and `.vercel/` stay untracked.
- Preview does not receive the production Supabase secret.
- Vercel Development variables are not the local source of truth.
- Rotate a secret immediately if it is printed, committed, or sent to an
  unapproved recipient.

## Verification

```bash
npm run verify:targets
npm run verify:deploy
git ls-files | rg '(^|/)\.env'
```

Only `.env.example` should be tracked.
