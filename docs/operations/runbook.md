# Production Operations Runbook

**Owner:** Operations/release owner
**Review trigger:** Support process, provider, monitoring, or operational change
**Last reviewed:** 2026-07-28

## System endpoints

| System      | Identifier                                    |
| ----------- | --------------------------------------------- |
| Application | `https://plexus-gules.vercel.app`             |
| GitHub      | `AGA-Ventures/plexus`                         |
| Supabase    | `Plexus` / `pnjblggcdigekluualin`             |
| Vercel      | `plexus` / `prj_vQpMXPAmIiSrED4IB0s1ZqAwDD0C` |

Run `npm run whereami` from the repository before any operational action.

## Daily checks during launch

- Production home and login respond.
- Superadmin, Admin, and Vendor login issues are reviewed.
- Vercel runtime errors and failed deployments are reviewed.
- Supabase Auth and API errors are reviewed.
- New Vendors can save their registration profile.
- Vendors can upload, review, and delete an approved test PDF without leaving
  a temporary object behind.
- No unexpected tenant or account suspension exists.
- Known provider adapters are not represented as completed production actions.

## Account operations

### Bootstrap first Superadmin

Use only when no approved Superadmin exists:

```bash
npm run bootstrap:superadmin
```

The guarded command requires approved values in `.env.local`, refuses a second
Superadmin by default, and does not print the password.

### Create Admin

Use the Superadmin control center. Confirm:

- Tenant slug/name/support email.
- Named Admin owner.
- Public tenant support email and private Admin login email are correctly
  identified.
- Temporary password and confirmation match.
- Secure password delivery.
- Successful first login and tenant scope.

### Create Vendor

Use Superadmin or the owning Admin. Confirm:

- Correct Admin tenant.
- Correct `delegation` or `partner` subtype.
- Company/contact details.
- Secure email/password delivery.
- Successful first login and profile save.

Until invitation and first-time password setup are implemented, initial
credential delivery is a controlled manual process and must not use public
chat or repository files.

### Password recovery

Users request recovery from the tenant-aware login page. The public response
is deliberately generic so it does not reveal whether an account exists.
Supabase exchanges the one-time email code at `/auth/callback`; only the
recovered user session can update its password, after which the session signs
out and returns to login.

An authenticated Superadmin can also choose **Send reset link** from an Admin
tenant row. That server action revalidates the target as an active Admin,
records the request in the platform audit log, and uses the same tenant-aware
Supabase recovery flow. It never reveals or directly changes the password.

Before enabling recovery for a production cohort:

- Set the exact Supabase Auth Site URL and allow the approved
  `/auth/callback` origins.
- Copy the version-controlled `supabase/templates/recovery.html` into the hosted
  Supabase **Reset password** email template and use the subject
  `Reset your Plexus password`.
- Configure production SMTP with the sender name `Plexus Security` and a
  verified dedicated Auth sender address; the default `Supabase Auth` sender is
  restricted and not production-ready.
- Keep email-provider link tracking disabled so the one-time recovery URL is not
  rewritten.
- Send a recovery email to an approved test account and verify link exchange,
  password update, forced re-login, inbox sender, subject, and Plexus branding.

Review the template locally without sending email:

```bash
npm run preview:auth-email
```

Open `http://127.0.0.1:4174` and verify the email at narrow and wide widths.
The preview uses sample values only; it does not contact Supabase or send a
message.

### Suspend or restore

Use the management console so Auth state, application profile, tenant/company
state, and audit history remain aligned. A stale token is still denied by
active relational checks.

## Secure meeting provider operations

Before enabling provider creation:

1. Apply `20260727182004_secure_mutual_meeting_links.sql`, then
   `20260727191200_automatic_meeting_critical_incidents.sql`.
2. Set `NEXT_PUBLIC_APP_URL`, Supabase privileged access, and Zoom/Lark
   credentials in Vercel. Set `PLEXUS_DEFAULT_MEETING_PROVIDER` to `zoom` or
   `lark`. Keep every credential except the app origin server-only.
3. Ensure the Lark app's registered callback exactly equals
   `LARK_REDIRECT_URI`, then sign in as a Superadmin and visit
   `/api/lark/login` once.
4. Use a test match in one tenant. Log in as each Vendor and accept separately;
   confirm the first leaves it proposed and the second accepts it.
5. Confirm the second Vendor acceptance creates the configured provider
   meeting automatically without an Admin action. The API/UI must contain only
   `/m/<slug>`; verify the link is unavailable before its start, redirects
   during its window, and returns 410 after expiry.
6. In a non-production provider test, force one sanitized creation failure.
   Confirm Superadmin receives a critical incident with tenant, match,
   provider, category, time and attempt count, then restore the provider and
   use **Retry meeting creation**.

Lark access refreshes automatically and persists the rotated refresh token. If
Lark authorization is revoked or expires, repeat `/api/lark/login`; do not copy
tokens into chat, logs, or database consoles. One service-only creation job per
match prevents concurrent second-acceptance requests from creating duplicate
meetings. An active wrapper is reused; after expiry, a Superadmin retry or
authorized provider request replaces the wrapper and resets its access count.

## Triage by symptom

| Symptom                    | First checks                                                                |
| -------------------------- | --------------------------------------------------------------------------- |
| Everyone cannot log in     | Vercel status/env, Supabase Auth/API logs, public variables                 |
| One user cannot log in     | Auth user exists, active profile, exact app metadata, active tenant/company |
| Admin cannot create Vendor | `vendor_account_provisioning`, tenant status, production secret             |
| User sees wrong portal     | App metadata, profile binding, token refresh/sign-out                       |
| Cross-tenant data concern  | Disable affected account, preserve evidence, review RLS/audit immediately   |
| File upload fails          | Bucket policy, size/type, Storage logs, tenant scope                        |
| Tenant logo upload fails   | `tenant-branding` bucket, 2 MiB/type limit, server secret, tenant scope     |
| Vendor PDF upload fails    | `vendor-profile-documents` bucket, 6 MiB/PDF signature, active Vendor binding, Storage/API logs |
| Vendor PDF review fails    | Metadata row, private object path, select RLS, signed-URL creation, active session |
| Vendor PDF delete fails    | Delete RLS, object existence, Storage/API logs; retry before manual cleanup |
| Admin MOU upload fails     | `mou-documents` bucket, 10 MiB/PDF signature, own-tenant deal, Storage/API logs |
| MOU review fails           | `mou_documents` row, participating match, private object, select RLS, active session |
| MOU replacement/delete fails | Audit event, metadata/object consistency, Admin tenant binding; retry before orphan cleanup |
| Meeting creation is locked | Confirm both Vendor acceptance timestamps and owning Admin tenant           |
| Zoom creation fails        | Superadmin Critical incidents; check S2S app/scopes, Vercel vars and Zoom status, then retry |
| Lark creation fails        | Superadmin Critical incidents; check host authorization, callback/scopes and Lark status, then retry |
| Meeting link is 425/410/403| Start time / expiry / ten-open limit; do not reveal the raw provider URL     |
| Deployment fails           | Vercel build log, environment variables, target verification                |
| Migration fails            | Stop app promotion, retain error, inspect plan/history, create forward fix  |

## Logs and diagnostics

```bash
vercel ls
vercel inspect <deployment-url>
vercel logs <deployment-url> --level error --since 1h --no-branch
npm run verify:targets
npm run verify:deploy
```

Use Supabase Auth, API, Postgres, and Storage logs for the matching subsystem.
Do not paste credentials, tokens, raw meeting URLs, contact data, or complete
provider payloads into issues or chat.

## Production role verification

After auth, provisioning, routing, or RLS changes:

```bash
E2E_BASE_URL=https://production.example \
  node --env-file=.env.local scripts/verify-production-roles.mjs
```

Confirm both PASS messages, including temporary QA data removal.

## Backup and recovery

- Verify the Supabase plan's backup/PITR configuration in the Dashboard before
  the launch cohort grows.
- Test recovery procedures without overwriting Production.
- Application rollback uses an already verified Vercel deployment.
- Database recovery favors reviewed forward fixes; emergency restore requires
  incident leadership and a documented data-loss window.

## Escalation

Open an incident when there is:

- Unauthorized data exposure or cross-tenant access.
- Credential/secret exposure.
- Material data loss or corruption.
- Widespread login failure.
- Production unavailability.
- Incorrect external compliance, signing, or financial-impacting action.

Follow [Incident response](incident-response.md).
