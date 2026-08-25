# Production Operations Runbook

**Owner:** Operations/release owner
**Review trigger:** Support process, provider, monitoring, or operational change
**Last reviewed:** 2026-07-30

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
- Superadmin **Email sending** has no unexplained failures, bounces,
  suppressions, or complaints.
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

### Approve a Vendor application

Use the owning Admin's **Vendor management → Applications** tab:

1. Open the complete submitted profile and verify the company, contact email,
   fixed subtype, consent, and tenant.
2. Approve once. `provisioning` means another request has claimed the
   application; do not manually create a second Auth user.
3. Confirm the approved row has Auth/Vendor IDs and a setup-email timestamp.
4. If approval warns that email failed, keep the approved account and choose
   **Resend setup email** after checking Supabase Auth/SMTP health.
5. Ask the applicant to use the one-time tenant-branded link, set a compliant
   password, and sign in. Never request or transmit their password.

If provisioning fails, confirm the application returned to `pending` and that
no Auth user, `user_profiles`, subtype, or canonical Vendor record remains
before retrying. Rejection creates no account and sends a tracked decision
email without exposing internal review details.

Before production enablement:

- Apply the migration and run RLS/advisor tests.
- Configure production SMTP and the approved Site URL/callback redirects.
- Approve the application-data retention/deletion policy.
- Upgrade Vercel CLI, stage the `/api/vendor-applications` Firewall rule in log
  mode, inspect legitimate traffic, enforce in Preview, and publish the
  production rate limit only after release-owner approval.

### Configure email delivery

1. In Resend, use separate verified subdomains or senders for Auth and business
   email where possible. Confirm SPF, DKIM, and DMARC.
   The approved current sender is
   `Plexus <notifications@info.plexus.enterprises>`.
2. Connect Resend to Supabase Auth from the Resend integration page, select
   project `pnjblggcdigekluualin`, and use a dedicated Auth From address.
   Supabase continues to generate every password/setup token and link.
3. Set `RESEND_API_KEY`, `PLEXUS_EMAIL_FROM`, `RESEND_WEBHOOK_SECRET`, and
   `CRON_SECRET` as server-only Vercel variables for Preview and Production.
   Never paste or commit their values.
4. Register `https://<production-host>/api/webhooks/resend` for the Resend
   email lifecycle events. Copy its signing secret to
   `RESEND_WEBHOOK_SECRET`.
5. Deploy the hourly `/api/cron/email-reminders` schedule from `vercel.ts`.
   Vercel must send `Authorization: Bearer <CRON_SECRET>`.
6. Send one business test and one Supabase Auth recovery test. In Superadmin
   **Email sending**, confirm the business email reaches `delivered`; the Auth
   email remains `requested` while Resend/Supabase logs confirm SMTP delivery.

`requested` means Supabase Auth accepted the secure-email request. `sent` means
Resend accepted a business email. Only `delivered` confirms acceptance by the
recipient mail server. Do not manually upgrade one state to another.

### Directly create a Vendor

Use Superadmin or the owning Admin. Confirm:

- Correct Admin tenant.
- Correct `delegation` or `partner` subtype.
- Company/contact details.
- Secure email/password delivery.
- Successful first login and profile save.

The direct path still requires an operator-supplied temporary password as a
controlled fallback, but immediately asks Supabase Auth to send a secure setup
link. Never include the temporary password in email. Use the application
approval path for externally invited Vendors.

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
- Configure production SMTP with
  `Plexus <notifications@info.plexus.enterprises>`; the default `Supabase Auth`
  sender is restricted and not production-ready.
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
5. As the owning Admin, open **Meeting settings**, publish at least one
   weekday/time combination, save, and confirm the selected count persists.
6. Confirm the accepted match shows **Pending meeting** and **Propose
   meeting**. As the first Vendor, select a published date first and one
   published 1-hour time. Verify no `meetings` row exists and the card shows
   **Awaiting Vendor approval**.
7. As the counterpart Vendor, open **Review & approve**, verify the exact time
   and both approval states, then approve. Confirm one shared meeting appears
   for both Vendors. Repeat while closing the slot in another Admin session
   before approval and confirm the stale proposal fails safely.
8. As the owning Admin, confirm the provider meeting. The API/UI must contain
   only `/m/<slug>`; verify the link is unavailable before its start, redirects
   during its window, and returns 410 after expiry.
9. In a non-production provider test, force one sanitized creation failure and
   verify no raw provider response or URL reaches the browser or logs.

Lark access refreshes automatically and persists the rotated refresh token. If
Lark authorization is revoked or expires, repeat `/api/lark/login`; do not copy
tokens into chat, logs, or database consoles. New second-acceptance requests
do not start provider creation. Existing service-only creation jobs remain
available for controlled legacy incident retry. An active wrapper is reused;
after expiry, a Superadmin retry or authorized provider request replaces the
wrapper and resets its access count.

## Triage by symptom

| Symptom                         | First checks                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Everyone cannot log in          | Vercel status/env, Supabase Auth/API logs, public variables                                          |
| One user cannot log in          | Auth user exists, active profile, exact app metadata, active tenant/company                          |
| Admin cannot create Vendor      | `vendor_account_provisioning`, tenant status, production secret                                      |
| Application link is unavailable | Active tenant slug, server secret, subtype path, Supabase API health                                 |
| Application approval is stuck   | Row status, latest audit, Auth conflict, feature flag; never create a duplicate manually             |
| Setup email fails               | Approved application state, Supabase Auth/SMTP logs, redirect allowlist; use Admin resend            |
| User sees wrong portal          | App metadata, profile binding, token refresh/sign-out                                                |
| Cross-tenant data concern       | Disable affected account, preserve evidence, review RLS/audit immediately                            |
| File upload fails               | Bucket policy, size/type, Storage logs, tenant scope                                                 |
| Tenant logo upload fails        | `tenant-branding` bucket, 2 MiB/type limit, server secret, tenant scope                              |
| Vendor PDF upload fails         | `vendor-profile-documents` bucket, 6 MiB/PDF signature, active Vendor binding, Storage/API logs      |
| Vendor PDF review fails         | Metadata row, private object path, select RLS, signed-URL creation, active session                   |
| Vendor PDF delete fails         | Delete RLS, object existence, Storage/API logs; retry before manual cleanup                          |
| Admin MOU upload fails          | `mou-documents` bucket, 10 MiB/PDF signature, own-tenant deal, Storage/API logs                      |
| MOU review fails                | `mou_documents` row, participating match, private object, select RLS, active session                 |
| MOU replacement/delete fails    | Audit event, metadata/object consistency, Admin tenant binding; retry before orphan cleanup          |
| Meeting creation is locked      | Confirm both Vendor acceptance timestamps and owning Admin tenant                                    |
| Zoom creation fails             | Superadmin Critical incidents; check S2S app/scopes, Vercel vars and Zoom status, then retry         |
| Lark creation fails             | Superadmin Critical incidents; check host authorization, callback/scopes and Lark status, then retry |
| Meeting link is 425/410/403     | Start time / expiry / ten-open limit; do not reveal the raw provider URL                             |
| Deployment fails                | Vercel build log, environment variables, target verification                                         |
| Migration fails                 | Stop app promotion, retain error, inspect plan/history, create forward fix                           |

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
