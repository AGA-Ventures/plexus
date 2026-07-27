# Roadmap and Backlog

**Owner:** Product and engineering leads
**Review cadence:** Weekly
**Last reviewed:** 2026-07-27

This roadmap describes outcome order, not fixed calendar promises. GitHub
issues and pull requests hold execution detail.

## Now — controlled production

| Priority | Outcome                    | Acceptance                                                                                    |
| -------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| P0       | Reliable Vendor onboarding | Invitation/password-setup and recovery flows; no password sent in plain text                  |
| P0       | Repeatable deployment      | Vercel GitHub app connected to `AGA-Ventures/plexus`; Preview and `main` deploy automatically |
| P0       | Production identity        | Branded domain, exact Supabase Site URL/redirects, production email sender                    |
| P0       | Production observability   | Error tracking, uptime check, alert owner, release/error dashboard                            |
| P1       | Launch cohort              | Approved Admins/Vendors provisioned, support owner assigned, onboarding completion verified   |
| P1       | Release evidence           | Safari/Edge checks, mobile flows, accessibility and performance baseline                      |
| P1       | Data governance            | Retention, export, deletion, consent, and contact-data handling signed off                    |

## Next — replace operational adapters

| Priority | Outcome                      | Acceptance                                                                     |
| -------- | ---------------------------- | ------------------------------------------------------------------------------ |
| P1       | Meeting provider integration | Create/update/cancel with idempotency, timeout, retry, and audit               |
| P1       | Transactional communications | Production SMTP/email templates, delivery status, retry, unsubscribe rules     |
| P1       | Documents and signing        | Private document lifecycle, authorization, retention, e-sign provider          |
| P1       | Notifications                | User-targeted notification model, read state, provider delivery                |
| P1       | Compliance providers         | Approved contracts/credentials, normalized results, audit and failure handling |
| P2       | Event QR/check-in            | Signed or server-verified codes and attendance audit                           |
| P2       | Reporting                    | Tenant and platform funnels with reviewed metric definitions                   |

## Later — superapp platform

| Priority | Outcome                           | Acceptance                                                                    |
| -------- | --------------------------------- | ----------------------------------------------------------------------------- |
| P2       | Module capability registry        | Modules declare routes, permissions, status, owner, metrics, and dependencies |
| P2       | Domain events/outbox              | Reliable asynchronous integration boundary with replay/idempotency            |
| P2       | Fine-grained tenant configuration | Feature flags/plans without weakening authorization                           |
| P2       | Vendor teams                      | Multiple users per Vendor with explicit delegated permissions                 |
| P2       | Advanced audit/search             | Operator investigation and export with retention controls                     |
| P3       | AI assistance                     | Grounded, permission-aware assistant with evaluation and human approval       |
| P3       | Regional expansion                | Market configuration and localization beyond current programs                 |

## Known technical and operational debt

| Item                                      | Risk                                  | Planned response                                         |
| ----------------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| Manual Vendor credential delivery         | Account security/support              | Invitation and recovery flow                             |
| Vercel Git integration permission missing | Manual deployment dependency          | Grant repository access and verify                       |
| Provider placeholders                     | User expectation and workflow failure | Replace capability by capability                         |
| Limited observability                     | Slow incident discovery               | Add error, uptime, and product telemetry                 |
| Large operational portal component        | Change coupling                       | Extract by module after behavior tests                   |
| Local Supabase CLI not guaranteed         | Migration friction                    | Setup verification and contributor onboarding            |
| Upstream dependency advisories            | Supply-chain exposure                 | Track supported Next.js/sharp fixes; no forced downgrade |

## Backlog intake rules

A proposed item must include:

- User and business problem.
- Owning capability/module.
- Evidence or risk.
- Role, tenant, data, privacy, and provider impact.
- Acceptance criteria and success measure.
- Dependencies and proposed priority.

Items without an owner or acceptance criteria remain `Proposed`, not `Ready`.

## Release milestones

### Controlled launch

- Existing three-tier auth and RLS remain green.
- Approved users receive accounts and support instructions.
- Known adapter limitations are disclosed.
- Production smoke tests and rollback are available.

### Operational production

- P0 `Now` outcomes are complete.
- Core user journeys use production providers.
- Monitoring and incident response are active.
- Data governance is approved.

### Superapp platform

- Module contracts and capability registry are enforced.
- Tenant configuration and events scale without cross-module coupling.
- New modules can be added with repeatable security, test, and operations
  standards.
