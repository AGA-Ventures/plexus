# Environment Variables

**Owner:** Engineering and operations
**Review trigger:** Environment variable addition, removal, or scope change
**Last reviewed:** 2026-07-30

`.env.example` is the machine-readable variable inventory. This document
explains ownership and scope; it never contains real secrets.

## Application variables

| Variable                               | Browser-visible | Local            | Preview  | Production  | Purpose                                                      |
| -------------------------------------- | --------------- | ---------------- | -------- | ----------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes             | Required         | Required | Required    | Approved Supabase API URL                                    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes             | Required         | Required | Required    | Public client key; RLS is the boundary                       |
| `SUPABASE_SECRET_KEY`                  | No              | Privileged tasks | No       | Required    | Preferred Auth Admin/privileged database credential          |
| `SUPABASE_SERVICE_ROLE_KEY`            | No              | Optional alias   | No       | Supported   | Legacy server-only alias when no secret key is present       |
| `NEXT_PUBLIC_SITE_URL`                 | Yes             | Optional         | Optional | Recommended | Canonical origin for recovery links and metadata             |
| `NEXT_PUBLIC_APP_URL`                  | Yes             | Required         | Required | Required    | Exact origin used to build wrapped meeting links             |
| `PLEXUS_PUBLIC_CONTACT_EMAIL`          | No              | Optional         | Optional | Recommended | Approved public inquiry mailbox rendered as a mail link and the server-only recipient for public enquiries |
| `PLEXUS_PUBLIC_WHATSAPP_NUMBER`        | No              | Optional         | Optional | Optional    | Approved WhatsApp destination rendered on public inquiry and pre-event pages; replace the temporary example before launch |
| `PLEXUS_PUBLIC_WHATSAPP_DISPLAY`       | No              | Optional         | Optional | Optional    | Human-readable form of the approved WhatsApp number          |

## Meeting provider variables

| Variable                          | Browser-visible | Purpose                                             |
| --------------------------------- | --------------- | --------------------------------------------------- |
| `ZOOM_ACCOUNT_ID`                 | No              | Zoom Server-to-Server OAuth account                 |
| `ZOOM_CLIENT_ID`                  | No              | Zoom Server-to-Server OAuth client                  |
| `ZOOM_CLIENT_SECRET`              | No              | Zoom Server-to-Server OAuth secret                  |
| `PLEXUS_DEFAULT_MEETING_PROVIDER` | No              | Automatic provider; `zoom` or `lark`, defaults Zoom |
| `LARK_APP_ID`                     | No              | Lark Custom App OAuth client                        |
| `LARK_APP_SECRET`                 | No              | Lark Custom App OAuth secret                        |
| `LARK_REDIRECT_URI`               | No              | Exact registered Lark callback URI                  |

Production uses
`https://www.plexus.enterprises/api/lark/callback` as the registered Lark
redirect. The value sent during both authorization and code exchange comes
directly from `LARK_REDIRECT_URI`; do not normalize, append to, or reconstruct
it. Lark consent includes `vc:reserve`, `vc:reserve:readonly`, and
`offline_access` so the host can authorize once and the server can rotate the
refresh token.

## Email delivery variables

| Variable                | Browser-visible | Preview  | Production | Purpose                                                          |
| ----------------------- | --------------- | -------- | ---------- | ---------------------------------------------------------------- |
| `PLEXUS_EMAIL_FROM`     | No              | Required | Required   | Branded Resend From value; `RESEND_FROM_EMAIL` is a legacy alias |
| `RESEND_API_KEY`        | No              | Required | Required   | Resend API credential for business and operational email         |
| `RESEND_WEBHOOK_SECRET` | No              | Required | Required   | Verifies Resend lifecycle webhook signatures                     |
| `CRON_SECRET`           | No              | Required | Required   | Authorizes the hourly reminder route                             |

The approved branded sender is
`Plexus <notifications@info.plexus.enterprises>`. Supabase Auth custom SMTP may
use the same verified sender, but Supabase—not application code—continues to
generate password and account-setup links.

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
- `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Resend credentials,
  `CRON_SECRET`, Zoom credentials, and Lark credentials must never use a
  `NEXT_PUBLIC_` prefix.
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
