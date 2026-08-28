# Feature Plan: TChina Expo 2026 Registration

**Status:** Production questionnaire open with labelled sample event details; official details and approval delivery deferred
**Owner:** Plexus Superadmin / Organizer and Engineering
**Target:** Guangzhou, 31 August–4 September 2026
**Capability/module:** TChina Expo registration
**Last updated:** 2026-08-28

## Problem and evidence

Plexus needs one trustworthy public questionnaire for individual Expo attendees,
without creating accounts or implying entry before human review. Business
Delegates need richer matching questions than General Visitors. The event is a
Plexus-operated campaign, not a tenant feature.

## Outcome and measures

- One attendee submits one bilingual, path-specific registration for review.
- Valid registrations reach one Plexus Superadmin queue with the correct branch
  answers and `pending` status.
- No tenant identifier, public database credential, document upload,
  passport/visa/financial field, or pre-approval entry confirmation is used.

## Scope

### Included

- English and Simplified Chinese public questionnaire at
  `/[locale]/tchina-expo`.
- Business Delegate and General Visitor branches, review/edit, and pending
  receipt.
- Strict 64 KiB API, honeypot, duplicate privacy, normalization, one Plexus
  singleton event, RLS, audit evidence, Superadmin setup/list/detail/reject,
  and confirmed deletion.
- Development-only non-persisting preview at
  `/[locale]/tchina-expo/preview`.

### Excluded from this slice

- Approval, invitation/resend email, registration receipt/Admin alert email,
  and Delegate Auth/account provisioning.
- Tenant ownership or normal Admin access.
- PDF, QR, visa letter, passport/identity data, uploads, WhatsApp automation,
  WeChat automation, bulk approval, and generic multi-event management.

## User journeys

1. A Plexus Superadmin enters the exact venue, organizer, and support email,
   then opens registration and copies the public link.
2. An attendee opens the public link without logging in, chooses a path,
   completes shared and tailored questions, reviews the answers, consents, and
   submits.
3. The attendee receives a pending receipt that explicitly is not entry
   confirmation.
4. A Plexus Superadmin searches the queue, inspects the questionnaire, rejects
   a pending item, or confirms manual deletion.

## Module contract

| Area                      | Decision                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Owner                     | Plexus Superadmin / Organizer; Engineering owns the trust boundary                                                           |
| Routes/APIs               | `/[locale]/tchina-expo`, `/[locale]/superadmin` TChina tab, `POST /api/tchina-expo/registrations`                            |
| Roles and authorization   | Public submission through server-only client; active Superadmin-only protected read/manage through RLS                       |
| Tenant/company scope      | None; the server resolves the single row whose immutable `singleton_key` is `plexus`                                         |
| Tables/migrations         | `tchina_events`, `event_registrations`; `20260825201902_plexus_tchina_expo_registration.sql` plus link indexes               |
| Server/domain interface   | Strict Zod request contract, singleton published-event resolver, authenticated Superadmin actions                            |
| Domain events             | Publish/update, rejection, and deletion are written to `audit_events`                                                        |
| External providers        | None active in this slice; email and Auth setup deliberately deferred                                                        |
| Failure/retry/idempotency | Same success for duplicate/honeypot; one non-rejected normalized email per event; rejected email may resubmit                |
| UX states/locales/mobile  | EN/zh, four steps, validation focus, country before mobile details, preferred contact method after them, Email reuses the supplied email address, WhatsApp defaults to the international mobile number but remains editable, business-matching follow-up may use the supplied email without automated messages, review editing, capped briefing rail from 880px, stacked mobile layout, pending receipt |
| Tests                     | Zod/API unit tests, pgTAP RLS contract, hosted RLS probes, and browser route checks                                          |
| Monitoring/support        | Superadmin-configured support email; API errors log only sanitized database codes                                            |
| Documentation             | Module, routes, schema, role guide, test catalog, status, roadmap, changelog, and Development Command Center                 |

## Security and privacy

- Threats: client-supplied ownership, duplicate probing, oversized bodies,
  bots, unauthorized database access, answer mutation, and illegal review
  transitions.
- Personal data: name, email, international mobile, optional chat ID,
  country/region, attendance dates, and business/visit answers.
- Retention/export/deletion: indefinite by default; Superadmin-confirmed
  registration deletion does not cascade to accounts, audit, or email ledgers.
- Abuse controls: strict schema, 64 KiB limit, hidden honeypot, generic
  duplicate response, no anonymous table grant, and no tenant field in the
  public contract.
- Database access: anonymous, Vendor, and normal Admin roles cannot read or
  manage either TChina table. Only active Superadmins can read; service-only
  server paths perform writes.

## Delivery slices

| Slice | Outcome                                          | Dependencies                                                   | Acceptance                              |
| ----- | ------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------- |
| 1     | Public questionnaire and Superadmin setup/review | Applied schema and server secret                               | Unit/type/build, RLS, and browser proof |
| 2     | Approval, invitations, account setup, and resend | Provisioned email sender, Auth redirects, controlled mailboxes | Delivery lifecycle and cleanup tests    |

## Acceptance criteria

- [x] One public route renders EN and zh versions of the questionnaire.
- [x] Both attendee paths collect only approved fields and end in review/edit.
- [x] Submission is bound to the Plexus singleton on the server and remains pending.
- [x] Only Plexus Superadmin can configure/publish, copy the link, review,
      reject, and confirm deletion.
- [x] Hosted migration is applied, and Admin/anonymous database denial is
      verified.
- [x] Production EN and zh questionnaire routes render with visibly labelled
      sample event details for controlled testing.
- [ ] Enter the exact official venue, organizer, and support email.
- [ ] Complete one controlled production submission and verify it appears only
      in the Superadmin queue.
- [ ] Resume the provider slice before enabling approval or sending email.

## Rollout and rollback

- The hosted database has one open Plexus event with visibly labelled sample
  venue, address, organizer, and support details. Replace every sample value
  with verified official information before distributing the link publicly.
- Local visual QA uses `http://localhost:3000/en/tchina-expo/preview` and the
  corresponding `/zh/` route. It uses marked fixtures and never saves data.
- Deploy schema before routes. Closing the event returns the public route to
  the noindex unavailable/not-found state and makes the submission API return 404.
- Production smoke: open link renders, one controlled submission appears only
  in the Superadmin queue, and Admin/Vendor routes have no TChina entry.
- Rollback: close registration, preserve submitted rows, and forward-fix code
  or schema rather than deleting evidence.

## Open decisions

- Exact official venue/address, organizer, and support mailbox.
- Verified sender/domain and controlled mailboxes for the deferred delivery
  slice.
- Exact approval and rejection email wording.
