# Project Status

**Owner:** Release owner
**Review trigger:** Production deployment, target, integration, launch, or major readiness change
**Last reviewed:** 2026-07-27 (Asia/Kuala_Lumpur)

## Production state

| Area                 | Current state                                       |
| -------------------- | --------------------------------------------------- |
| GitHub               | `AGA-Ventures/plexus`; production branch `main`     |
| Production release   | PR #1 merged at `4995bbf`                           |
| Supabase             | `Plexus` (`pnjblggcdigekluualin`), active           |
| Database             | PostgreSQL 17; all 20 migrations recorded           |
| Database security    | 19/19 public tables use RLS; security advisor clean |
| Vercel               | `plexus` (`prj_FUkKgAm7UXkFGTgmtFM8ynaSHKuE`)       |
| Production URL       | `https://plexus-gules.vercel.app`                   |
| Deployment           | Manual production deployment verified               |
| Automatic Git deploy | Blocked pending Vercel GitHub repository access     |
| Vendor provisioning  | Enabled                                             |
| Role verification    | Superadmin/Admin/Vendor production flow passed      |

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
- Release verification and rollback paths exist.
- Production route and role smoke tests pass.

Not yet broad-public complete:

- Vendor invitation/password recovery.
- Automatic Vercel Git deployment.
- Branded domain and production Auth email configuration.
- Error tracking, uptime, product analytics, and alert ownership.
- Production providers for several meeting, email, signing, notification, QR,
  and compliance workflows.
- Recorded Safari/Edge, accessibility, and performance baselines.
- Final data retention/privacy operations.

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
