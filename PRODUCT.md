# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are tenant operators such as chambers, trade bodies,
associations, and event organizers running branded cross-border business
programs. Their job is to turn company intake into relevant introductions,
confirmed meetings, agreements, and measurable follow-through without losing
governance or operational visibility.

Participating companies are the second audience. They maintain a company
profile and take part in the matching, meeting, agreement, event, and resource
workflows their tenant permits. Plexus platform operators support both groups
through cross-tenant governance, account administration, audit, configuration,
and controlled recovery.

## Product Purpose

Plexus is a multilingual, multi-tenant business operations superapp for
cross-border business programs. It replaces fragmented profiles,
spreadsheets, shortlists, and post-event follow-up with one governed journey
from structured onboarding through matching, mutual acceptance, meetings,
agreements, event operations, and continued collaboration.

Success means tenant operators can launch and run a trustworthy program with
less manual coordination, participating companies reach relevant meetings and
follow-up faster, and Plexus can extend to more markets and programs without
forking the application or weakening tenant isolation.

## Positioning

Plexus is a multilingual, white-label operating layer that replaces fragmented
cross-border B2B spreadsheets with a governed journey from structured profiles
through organizer-reviewed matching, mutual acceptance, meetings, agreements,
and follow-up. Its differentiator is not a standalone matching score: it keeps
identity, tenant scope, human review, operational preparation, provider
handoffs, evidence, and next actions together in one auditable workspace.

## Operating Context

Plexus initially serves Malaysia–Macao and Greater China business corridors,
with expansion intended across Asia through local, white-label tenant
programs. Tenant operators provision or approve participating companies,
review matching activity, coordinate meetings and interpreters, track MOUs and
event operations, publish communications and resources, and export operational
records.

Participating companies enter as Delegation or Partner Vendor subtypes. They
maintain profiles, discover permitted counterparties, request and mutually
accept matches, approve meeting times, join protected meetings, sign their side
of an MOU after completion, and use the event information shared with their
company. Public pre-event visitors may prepare a localized WhatsApp inquiry;
the page does not submit or persist their information.

The production posture is controlled rather than broad-public. Some external
provider and automation surfaces remain adapters or simulations until their
credentials, failure behavior, monitoring, ownership, and end-to-end evidence
are production-ready.

## Capabilities and Constraints

- Authorization has three roles: Superadmin, Admin, and Vendor. Delegation and
  Partner are Vendor subtypes, not independent roles.
- Role, tenant, and company scope come from trusted server-side bindings and
  database Row Level Security, never from client-selected state, route
  parameters, or email domains. Cross-tenant authorization incidents have a
  target of zero.
- Admin tenants are isolated and white-labelled. Vendors see only their own
  company and explicitly shared workflow records.
- The live product covers identity and tenancy, Vendor onboarding and
  profiles, discovery and matching, meetings and interpreters, deals and MOU
  workflows, event operations, communications and resources, governance,
  audit, and controlled reporting.
- Sensitive matching, compliance, legal, credit, account, and provider
  decisions remain human-governed, reviewable, and auditable.
- User-facing workflows support English, Simplified Chinese, Traditional
  Chinese, and Thai. Locale-aware routes and content are product requirements.
- A polished interface is not evidence that a capability is live. Provider,
  AI, customer, testimonial, market-coverage, pricing, compliance, and outcome
  claims must reflect verified production state.
- New modules must define their outcome, owner, routes, authorization, data,
  interface, events, integrations, UX states, quality evidence, operations,
  and documentation before being called production-ready.

## Brand Commitments

The product name is Plexus. The platform supports tenant-specific names, logos,
support contacts, and primary colors while preserving secure and readable
authentication and workspace behavior. The Plexus voice is precise,
trustworthy, operational, multilingual, and candid about availability,
provider readiness, human review, and controlled-production boundaries.

Malaysia, Macao, Greater China, and future Asian corridor language must not
imply delivery in an unverified market. Plexus may coordinate or refer travel
and event requests, but it is not presented as a booking marketplace, payment
surface, visa authority, approval guarantee, or autonomous dealmaker.

## Evidence on Hand

- Canonical product intent, roles, capability status, architecture, security,
  testing, and release posture are maintained under `docs/`.
- The repository contains runnable public, Superadmin, Admin, Vendor, and
  compliance surfaces backed by unit tests, authorization tests, RLS tests,
  release checks, and a production build.
- Existing Plexus marks, wordmarks, event imagery, product imagery, videos, and
  a draft MOU are available under `public/`. Tenant-specific brand assets are
  stored through the tenant branding workflow.
- Localized product copy exists for the supported public and authenticated
  experiences.
- Verified public customer logos, testimonials, case studies, benchmarks, and
  broad-market proof are not currently on hand and must not be fabricated.
- Several legal pages and production-provider claims remain explicitly
  provisional; their presence is not evidence of legal approval or provider
  readiness.

## Product Principles

1. Move from business intent to accountable follow-through, not merely an
   introduction or ranking.
2. Keep automation human-governed, explainable, recoverable, and auditable.
3. Preserve explicit identity, tenant, company, and data scope at every step.
4. Make multilingual, white-label operation a core platform capability rather
   than a per-program fork.
5. Represent production readiness honestly and require evidence before making
   claims.

## Accessibility & Inclusion

Plexus must remain usable across supported languages, mobile and desktop
layouts, and keyboard-only workflows. Interactive states require logical focus
order, visible focus, readable contrast under platform and tenant branding,
safe dialog behavior, and reduced-motion consideration. A formal accessibility
conformance baseline has not yet been recorded, so future work must not claim
one until it is measured and documented.
