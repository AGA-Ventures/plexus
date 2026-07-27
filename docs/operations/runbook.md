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
| Vercel      | `plexus` / `prj_FUkKgAm7UXkFGTgmtFM8ynaSHKuE` |

Run `npm run whereami` from the repository before any operational action.

## Daily checks during launch

- Production home and login respond.
- Superadmin, Admin, and Vendor login issues are reviewed.
- Vercel runtime errors and failed deployments are reviewed.
- Supabase Auth and API errors are reviewed.
- New Vendors can save their registration profile.
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
- Correct email.
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

Before enabling recovery for a production cohort:

- Set the exact Supabase Auth Site URL and allow the approved
  `/auth/callback` origins.
- Configure production SMTP; do not rely on the restricted default sender for
  external Admin or Vendor recipients.
- Send a recovery email to an approved test account and verify link exchange,
  password update, forced re-login, and tenant branding.

### Suspend or restore

Use the management console so Auth state, application profile, tenant/company
state, and audit history remain aligned. A stale token is still denied by
active relational checks.

## Triage by symptom

| Symptom                    | First checks                                                                |
| -------------------------- | --------------------------------------------------------------------------- |
| Everyone cannot log in     | Vercel status/env, Supabase Auth/API logs, public variables                 |
| One user cannot log in     | Auth user exists, active profile, exact app metadata, active tenant/company |
| Admin cannot create Vendor | `vendor_account_provisioning`, tenant status, production secret             |
| User sees wrong portal     | App metadata, profile binding, token refresh/sign-out                       |
| Cross-tenant data concern  | Disable affected account, preserve evidence, review RLS/audit immediately   |
| File upload fails          | Bucket policy, size/type, Storage logs, tenant scope                        |
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
Do not paste credentials, tokens, contact data, or complete provider payloads
into issues or chat.

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
