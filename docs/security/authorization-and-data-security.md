# Authorization and Data Security

**Owner:** Security and engineering
**Review trigger:** Auth, role, RLS, storage, secret, provider, or privacy change
**Last reviewed:** 2026-07-29

## Security objectives

- Prevent access across Admin tenants.
- Limit Vendors to their own company and explicitly shared workflow records.
- Prevent self-promotion or client-controlled authorization.
- Keep privileged credentials out of browser code and source control.
- Audit privileged lifecycle and binding changes.
- Fail closed when claims, profiles, tenants, or companies are missing/inactive.

## Trust model

Authorization uses trusted Supabase Auth `app_metadata`. `user_metadata` is
display-only and must never be used in RLS or access decisions.

| Role       | Required binding                                                    |
| ---------- | ------------------------------------------------------------------- |
| Superadmin | `role=superadmin`; no tenant/Vendor fields                          |
| Admin      | `role=admin`, valid `admin_id`                                      |
| Vendor     | `role=vendor`, valid `admin_id`, `vendor_company_id`, `vendor_type` |

Every request also validates an active `user_profiles` row with an exact claim
match. Admin/Vendor access requires active owning records.

## Defense in depth

```mermaid
flowchart TD
    C["Untrusted client request"] --> P["Proxy session/route guard"]
    P --> I["Server identity validation"]
    I --> O["Operation authorization"]
    O --> R["Postgres RLS"]
    R --> K["Constraints and binding-protection triggers"]
    K --> A["Audit event"]
```

No single UI or middleware check is treated as sufficient.

## RLS rules

- All public business tables have RLS enabled.
- `anon` has no business-table access.
- Policies target `authenticated` and add tenant/company predicates.
- `TO authenticated` alone is not authorization.
- Updates use both `USING` and `WITH CHECK`.
- Vendor access to matches, meetings, and deals requires participation by the
  Vendor's own company.
- Meeting-provider readiness is computed server-side and exposes only
  configuration/authorization states to the Admin UI. Zoom/Lark credentials,
  OAuth tokens, and raw provider meeting links remain server-only.
- Audit events are append-only to normal application roles.
- Direct changes to role, tenant, company, or subtype bindings are protected by
  constraints and triggers.

See the [database schema](../architecture/database-schema.md) for the live
policy summary.

## Privileged clients and secrets

- Browser/client code uses only the Supabase URL and publishable key.
- The publishable key is not a secret; RLS is the data boundary.
- `SUPABASE_SECRET_KEY` is server-only and Production-only in Vercel.
- The Supabase Admin client must never be imported by a Client Component.
- Secrets must not appear in Git, `.env.example`, logs, screenshots, issues, or
  user-visible errors.
- Rotate a credential when exposure is suspected; removing it from a file is
  not enough.

## Sessions and account state

- Role/binding changes require token refresh or sign-in before claims are
  trusted as current.
- Database active checks deny stale tokens for suspended accounts.
- Deleting an Auth user alone is not a complete session-revocation strategy.
- Sensitive account disablement should suspend relational access and revoke or
  expire sessions according to the current Supabase Auth policy.
- Public Auth signup and anonymous sign-in remain disabled. Public Vendor
  application intake creates only an RLS-protected pending record through a
  server-only route; it cannot create or select Auth identities.
- Tenant-branded login slugs are untrusted context. After authentication, the
  server compares the requested active tenant with the account's trusted
  `admin_id`; a mismatch signs the user out and returns a generic error.
- Tenant branding is loaded server-side. It changes presentation only and does
  not participate in role or row-level authorization.

## Account provisioning

- Superadmin is bootstrapped through a guarded server-side process.
- Only Superadmin creates Admin tenants/accounts.
- Admin creates Vendors only in its own active tenant and only when platform
  provisioning is enabled.
- Provisioning uses the Auth Admin API and exact relational bindings.
- Admin provisioning validates the temporary password confirmation in both the
  browser and the Server Action before creating any tenant or Auth record.
- Partial failures roll back created Auth/database records.
- Approved public applications create passwordless, server-confirmed Auth
  identities and use the verified tenant-aware recovery callback as a
  one-time setup flow. The setup link does not contain role or tenant authority.
- Public password-recovery requests return a generic response, the callback
  rejects non-reset destinations, and the password mutation requires a
  verified Supabase user session.

## Storage

The `event-resources` bucket is private. File access requires an authenticated,
authorized metadata record and server-mediated path.

The `vendor-profile-documents` bucket is also private. It accepts only PDF
objects up to 6 MiB. Both the metadata table and Storage policies independently
require an active actor and an exact tenant/company path match. The Vendor
handler validates extension, declared MIME type, and `%PDF-` signature,
sanitizes the filename, creates the tenant/company-prefixed path on the server,
and never returns that path to the browser. Review uses a 60-second signed URL.
Delete requires explicit UI confirmation and removes both the private object
and its metadata.

The `mou-documents` bucket is private and accepts only PDFs up to 10 MiB.
Admins may create, replace, and delete documents only for deals in their own
tenant. Vendors may read only when their trusted company binding participates
in the deal's match. The server validates extension, MIME, size, `%PDF-`
signature, and object name; the browser receives only a protected review
route, which returns a 60-second signed URL. Metadata and deal mutations are
audited.

Vendor MOU acceptance is a separate trusted database mutation. The client
sends only a deal UUID and a required `true` agreement. The database
revalidates the active profile, tenant, Vendor subtype, match participation,
and existence of a completed meeting, then derives which party may be signed
from trusted claims. Each party's signer UUID and timestamp are append-only in
the product workflow; an Admin cannot sign on behalf of a Vendor, an unrelated
Vendor cannot discover or sign the row, and the deal cannot become `Signed`
until both Vendor timestamps exist.

For upload/replacement policies, validate:

- Tenant ownership.
- Deal/match participation.
- Audience.
- MIME allowlist.
- Module-specific size limit.
- Sanitized filename and storage path.
- Download authorization.
- Deletion and retention behavior.

## Server APIs and providers

- Authenticate and authorize every route handler.
- Validate request bodies with a schema.
- Never accept `admin_id`, role, or company binding without comparing it to the
  authenticated identity.
- Apply timeouts to external providers.
- Use idempotency for create/send/charge/sign operations.
- Normalize provider errors; do not return credentials or raw sensitive
  payloads.
- Rate-limit abuse-prone endpoints, especially login, password recovery,
  uploads, email, compliance, and AI.
- Log request IDs and safe metadata, not direct personal data.

### Email delivery boundary

- Supabase Auth alone generates recovery and setup tokens. Plexus never reads,
  stores, or recreates those links and records only the request outcome.
- Resend API credentials, From configuration, webhook signing secret, and cron
  secret are server-only environment variables.
- Every business email creates one service-written delivery row per recipient.
  Authenticated application roles have no insert/update/delete grant.
- Only an active Superadmin can select delivery rows or sanitized lifecycle
  events. Admin and Vendor sessions receive zero rows even for their own
  tenant.
- The signed Resend webhook verifies the raw body and Svix headers before
  matching a provider message ID. Unique provider event IDs make retries
  idempotent.
- The ledger stores address, subject, actor, trigger, and status for
  operations, but never message bodies, provider credentials, raw responses,
  or password/setup links.
- Reminder execution requires the exact `CRON_SECRET` bearer value and checks
  same-day source records before sending.

### Tenant Vendor discovery boundary

- The owning Admin updates only its server-derived tenant row; the browser
  supplies the desired boolean but never a tenant ID.
- Hiding **Find companies** is presentation only. The Server Component
  redirects disabled discovery routes before loading candidates.
- `match_candidates()` checks the active tenant capability and returns no rows
  when disabled.
- `match_participants()` is capability-independent but returns only limited
  summaries for companies already connected to the caller through visible
  own-tenant matches, preserving match context without reopening browsing.
- The `matches` insert policy applies the same capability to Vendor-created
  requests. Superadmin and owning-Admin matching permissions are unchanged.

### Vendor match acceptance boundary

- The Server Action derives Vendor subtype and company ownership from the
  authenticated trusted identity and accepts only a match UUID plus the
  `Accepted` or `Proposed` intent.
- A Vendor can set or clear only its own acceptance timestamp. The database
  trigger permits a clear only while the other Vendor has not accepted and no
  meeting exists. It rejects attempts to write the other Vendor's timestamp,
  set `Rejected`, rewrite an existing acceptance, withdraw after the boundary,
  or force `Accepted` / `Session Scheduled`.
- Acceptance of a legacy `Rejected` row sends `Proposed` with the new own-party
  timestamp; the trigger derives `Accepted` only when both timestamps exist.
- Admins may reset an own-tenant match to `Proposed` or `Rejected` but cannot
  record an acceptance on behalf of either Vendor.
- PostgreSQL serializes competing updates to the match row, so a withdrawal
  racing the second acceptance cannot have both operations succeed against the
  same one-sided state.
- The second match acceptance stops at the accepted boundary and starts no
  provider call. `proposeMeetingAction` revalidates the participating Vendor,
  both match acceptances, the accepted/scheduled match state, and the absence
  of an existing future meeting before storing one tenant-scoped proposal.
- `meeting_proposals` RLS exposes a proposal only to the owning Admin,
  Superadmin, and its two participating Vendors. The mutation trigger derives
  the proposing identity from trusted Auth bindings, makes proposal fields
  immutable, prevents cross-party approval, and requires two distinct
  subtype-owned approval records before inserting `meetings`.
- Proposal creation and second approval both reload or re-check the owning
  `admin_tenants.meeting_availability` value and accept exactly one future
  Asia/Kuala_Lumpur slot that the tenant currently exposes. Closing a slot
  before approval makes the stale proposal fail safely. Only the active owning
  Admin can update this tenant configuration. Vendors may read it through
  their validated tenant identity but cannot alter it. Existing automatic
  meeting jobs remain service-only legacy incident records.

### Public Vendor application boundary

- The route accepts no `admin_id`; the active tenant is resolved from the
  validated slug and the subtype is fixed by the share URL.
- Every 25-item public-intake profile answer, including consent, is required.
  Meeting-arrangement preferences are deferred until after approval. Optional
  existing fields and the document checklist are retained; file uploads remain
  behind Vendor authentication.
- Request bodies are capped at 64 KiB, honeypot submissions are discarded, and
  logs omit contact/company profile values.
- A normalized-email partial unique index and a generic success response
  prevent duplicate identities and reduce account/email enumeration.
- `provisioning` is the concurrency claim. Approval revalidates the active
  Admin, exact tenant, platform permission, profile, and server secret before
  creating Auth or Vendor records.
- Vercel Firewall is staged in log mode for the stable API path before Preview
  enforcement and an explicit production publish decision.

## Privacy and data handling

Company profiles contain business contact data. Before broad public launch,
approve and document:

- Purpose and lawful basis/consent.
- Data minimization.
- Retention periods.
- User correction/export/deletion process.
- Processor/provider inventory.
- Cross-border transfer handling.
- Incident notification responsibility.

Production copies of personal/contact data must not be used in development,
tests, screenshots, or AI prompts without explicit approval and redaction.

## Threat checklist

| Threat                             | Required control                                          |
| ---------------------------------- | --------------------------------------------------------- |
| Broken object/tenant authorization | Server checks plus RLS predicates                         |
| Role escalation                    | Trusted app metadata, protected bindings, Admin API only  |
| Stale token after suspension       | Active relational validation                              |
| Secret in browser                  | Server-only naming/import boundaries and build review     |
| Malicious upload                   | Private bucket, MIME/size/path validation                 |
| Provider replay/duplicate          | Idempotency and audited state                             |
| Cross-site/script injection        | Framework escaping, validated content, CSP review         |
| Brute-force login/recovery         | Supabase rate limits, CAPTCHA/abuse review                |
| Audit tampering                    | Append-only policies and restricted writes                |
| Unsafe DB helper                   | Prefer invoker; private restricted definer functions only |

## Required verification

For an auth/schema/security change:

```bash
npm run test:unit
npm run test:rls
npm run test:e2e
npm run supabase:advisors
npm run verify:release
```

Also run the production role verifier after deployment and inspect Supabase and
Vercel errors.

## Security release blockers

Do not release when:

- A public table lacks RLS.
- A policy grants broad authenticated access without an ownership condition.
- A secret appears in a public/client variable or tracked file.
- Cross-tenant negative tests fail.
- A migration weakens binding constraints without approved replacement.
- A provider can perform a consequential action without authentication,
  authorization, validation, timeout, and audit.
