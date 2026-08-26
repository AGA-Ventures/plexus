# Project Status

**Owner:** Release owner
**Review trigger:** Production deployment, target, integration, launch, or major readiness change
**Last reviewed:** 2026-08-26 (Asia/Kuala_Lumpur)

## Production state

| Area                | Current state                                                                         |
| ------------------- | ------------------------------------------------------------------------------------- |
| GitHub              | `AGA-Ventures/plexus`; production branch `main`                                       |
| Production release  | `d4bdec25ab26`; Vercel deployment `dpl_33kJLevQvnv1s7kBy5442x4f8k3Y` is `READY`       |
| Supabase            | `Plexus` (`pnjblggcdigekluualin`), configured; CLI not linked and local stack offline |
| Database            | PostgreSQL 17; 47 committed migrations; live applied list not rechecked               |
| Database security   | 30/30 committed public tables enable RLS; live advisor last clean on 2026-07-28       |
| Vercel              | `plexus` (`prj_vQpMXPAmIiSrED4IB0s1ZqAwDD0C`); Git link and `main` branch verified    |
| Production URL      | `https://plexus-gules.vercel.app`, HTTP 200 on 2026-08-26                             |
| Deployment          | Latest `main` production deployment ready; Preview automation still needs fresh proof |
| Vendor provisioning | Enabled                                                                               |
| Role verification   | Historical production flow passed; current local browser suite has one stale public-navigation assertion |

The production role verification created temporary Admin/Vendor identities,
tested desktop/mobile login and route isolation, and removed all temporary
records.

## Account readiness

At the last review, Production had an active Superadmin and Admin but no
permanent Vendor account. The owning Admin must provision approved Vendors and
deliver credentials securely for the controlled launch cohort.

## Current launch posture

Ready for a controlled, disclosed production cohort:

- Three-tier authentication, tenancy, provisioning, and RLS are live.
- Vendor profile entry and core portal workflows are persisted.
- Release verification and rollback paths exist; the current release gate passes.
- Historical production route and role smoke tests passed. The 2026-08-26 local
  Playwright run passed 34 cases and failed two desktop/mobile copies of an
  unrelated stale pre-event CTA-label expectation; fresh complete browser
  evidence is required before the next release.

Not yet broad-public complete:

- Production SMTP, approved onboarding redirects, and complete recovery/setup
  evidence.
- Fresh automatic Preview and production-deployment evidence.
- Branded domain and production Auth email configuration.
- Error tracking, uptime, product analytics, and alert ownership.
- Production providers for several meeting, email, signing, notification, QR,
  and compliance workflows.
- Recorded Safari/Edge, accessibility, and performance baselines.
- Final data retention/privacy operations.
- TChina approval, invitation/resend delivery, Delegate account setup, and
  controlled-mailbox evidence. The hosted Plexus-owned schema is applied and
  closed; the public questionnaire and Superadmin-only setup/review code still
  require production deployment and exact official event details.

These items are prioritized in the
[roadmap](../project-management/roadmap.md).

## Live orientation

This document records durable reviewed state. For the live checkout:

```bash
npm run whereami
```

It shows branch, commit, upstream, push target, dirty files, Supabase link,
local environment, Vercel link, and change record.

## Update rule

Update this file after:

- A production deployment changes the release state.
- A deployment target, repository, domain, or production branch changes.
- A major launch blocker is completed or discovered.
- Authentication/provisioning posture changes.
- A provider becomes production-supported.
- Monitoring, backup, or incident ownership changes.
