# Secure Meeting Links

**Status:** Implementation complete; deployment verification pending
**Owner:** Plexus engineering and tenant operations
**Target:** Controlled production
**Capability/module:** Meetings and interpreters
**Last updated:** 2026-07-28

## Problem and outcome

A single Vendor could previously move a match into an accepted workflow, and
stored placeholder links did not create a real provider meeting. The outcome
is a meeting that can be created only after each participating Vendor records
its own acceptance, with a provider URL that is never returned to the browser.
Success is measured by two-party acceptance, provider creation, and an
expiring wrapped-link redirect without cross-tenant or raw-link exposure.

## Scope

Included: per-party acceptance, automatic Zoom or Lark creation after the
second acceptance, Lark host OAuth/token rotation, opaque share links,
meeting-window/access gates, tenant authorization, RLS-locked secret data,
durable creation jobs, critical Superadmin alerts and controlled retry.

Excluded: provider-side update/cancel, reminders, provider reconciliation,
unattended scheduled retries, attendance evidence, and general-purpose meeting
hosts.

## Module contract

| Area                      | Decision |
| ------------------------- | -------- |
| Owner                     | Engineering builds; owning Admin operates; release owner configures providers |
| Routes/APIs               | `POST /api/meetings`, `/api/lark/login`, `/api/lark/callback`, `/m/[slug]` |
| Roles and authorization   | Each Vendor accepts for itself; service automation creates after the second acceptance; Superadmin authorizes Lark and retries failures; opaque gate is public |
| Tenant/company scope      | Match, Admin, Delegation, and Partner must share the canonical tenant |
| Tables/migrations         | Acceptance columns, `oauth_tokens`, `meeting_provider_links`, `meeting_creation_jobs`; migrations `20260727182004` and `20260727191200` |
| Server/domain interface   | `createMeeting`, automatic creation coordinator, Zoom adapter, Lark adapter, authenticated Server Actions |
| Domain events             | A unique creation job claims the match; success/failure writes a sanitized audit event |
| External providers        | Zoom S2S OAuth; Lark user OAuth v2 with PKCE and rotated refresh token |
| Failure/retry/idempotency | 15-second provider timeout; one job per match; active link reuse; sanitized critical incident; Superadmin retry capped at 20 attempts |
| UX states/locales/mobile  | Own/other acceptance, automatic creation, pending link, Superadmin critical alert/retry, expired/limited link responses |
| Tests                     | Provider/helper/policy unit tests, RLS acceptance/isolation/incident tests, build, manual live smoke |
| Monitoring/support        | Failed jobs appear prominently to Superadmin with safe code, tenant, provider, time and attempt count |
| Documentation             | README, schema, routes, environment, product guide, testing, runbook, changelog |

## Security and privacy

- Raw provider URLs and Lark tokens live only in RLS-enabled tables with no
  browser-role policy or grant.
- Provider secrets and the Supabase administration key remain server-only.
- Slugs use 24 random bytes, links activate at the meeting time, expire at its
  end, and allow ten opens for two people to rejoin or refresh.
- The Zoom adapter parses only the attendee `join_url`; it never returns or
  logs `start_url`.
- The gate increments access with compare-and-set semantics to avoid exceeding
  the limit under concurrent opens.
- Creation jobs never store credentials, OAuth tokens, raw provider responses,
  or raw join URLs. Superadmin sees only the tenant, match, provider, sanitized
  failure category, attempt count, and time.

## Rollout and rollback

Apply both migrations before the application deployment, configure Vercel
variables and the default provider, authorize Lark once when selected, then
smoke-test mutual acceptance and automatic creation. Confirm a controlled
provider failure creates a Superadmin incident without exposing raw error data,
then retry after restoring the provider. An application rollback can use the
prior Vercel deployment; retain the additive schema and prepare a forward
migration for database corrections. Disable provider creation operationally by
removing its server credential while preserving existing wrapped links. Never
expose raw URLs as a fallback.
