# ADR 0001: Approval-gated tenant Vendor applications

**Status:** Accepted
**Date:** 2026-07-29
**Owners:** Product, engineering, security, and operations
**Related plan/PR:** Tenant Vendor Application and Approval

## Context

Admins need shareable, branded intake links for Delegation and Partner
companies. Letting a public form create Supabase Auth identities or choose an
`admin_id` would move role and tenant binding into an untrusted browser and
would create dormant/spam accounts before an operator verifies the company.
The existing Vendor workspace already owns the canonical company profile and
private PDF library.

## Decision drivers

- Preserve one trusted Auth identity to one Vendor company.
- Keep tenant/subtype authority server-derived.
- Reuse the existing profile contract and persistence mapping.
- Make concurrent approval and partial failure recoverable.
- Avoid email/account enumeration and public file-upload risk.

## Options considered

### Public Auth self-signup

- Benefits: immediate applicant access and common hosted-Auth pattern.
- Costs/risks: untrusted tenant/role binding, spam identities, incomplete
  profiles, and cleanup before operator approval.

### Draft application with secure resume links

- Benefits: long forms can be completed over time.
- Costs/risks: adds bearer-link lifecycle, partial-data retention, delivery,
  revocation, and enumeration concerns.

### Approval-gated complete application

- Benefits: no identity before review, fixed tenant/subtype, one complete
  canonical profile, and a clear audit/provisioning boundary.
- Costs/risks: applicant cannot save a draft and approval/email delivery is an
  operational dependency.

## Decision

Use two fixed public links per active Admin tenant. The public route validates
the 25-item public-intake profile and stores one `pending` application through
a server-only client. Meeting-arrangement preferences are intentionally
deferred until after approval. The route never accepts `admin_id`, creates
Auth, or uploads files.

The owning active Admin approves through an atomic
`pending → provisioning` claim. Approval creates the passwordless confirmed
Auth user with trusted app metadata, canonical/subtype Vendor, and exact active
profile binding, then marks the application approved and sends a tenant-aware
one-time setup link through the existing verified recovery callback. Partial
provisioning is removed and the claim returns to pending. Post-commit email
failure retains the account and supports resend.

## Consequences

### Positive

- Public users cannot grant themselves a role, tenant, or Vendor subtype.
- Duplicate approval is prevented before external identity creation.
- Vendor profile saves and approval share one persistence mapping.
- Supporting-document intent is captured without exposing public Storage.

### Negative/trade-offs

- No draft/resume flow in this release.
- A normalized email can have only one non-rejected application.
- Production onboarding depends on SMTP and approved redirect configuration.
- The legacy direct temporary-password path remains until migration is
  complete.

## Security, data, and operations impact

- `vendor_applications` contains business contact/profile data and requires a
  retention/deletion policy before broad production use.
- Anonymous and Vendor table access is denied; owning Admin and Superadmin
  governance access is enforced with active-actor RLS.
- The stable API path receives a Vercel Firewall rate limit after log-mode and
  Preview verification.
- Logs and audit events exclude profile/contact payloads beyond required
  relational evidence.

## Migration and rollback

Apply the additive migration before deploying routes/UI. Application behavior
can be disabled with `vendor_account_provisioning`; pending data remains
reviewable. Roll application code back to the previous deployment without
dropping the table. Use a reviewed forward migration for schema rollback or
retention cleanup.

## Follow-up

- Approve retention, export, correction, and deletion policy.
- Verify production SMTP, email branding, and Auth redirect allowlist.
- Complete both-subtype production E2E evidence.
- Evaluate secure draft/resume only after measuring form abandonment.
