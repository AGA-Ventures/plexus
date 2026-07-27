# Definition of Done

**Owner:** Product, engineering, and release owners
**Review trigger:** Quality or release policy change
**Last reviewed:** 2026-07-27

A work item is done only when all applicable sections pass.

## Outcome

- [ ] The user/business outcome and success measure are explicit.
- [ ] Acceptance criteria are demonstrated.
- [ ] Scope exclusions and remaining limitations are recorded.

## Product and UX

- [ ] Loading, empty, validation, error, and permission states exist.
- [ ] Mobile and keyboard behavior is verified.
- [ ] Supported locale copy and formatting are handled.
- [ ] Placeholder/provider behavior is clearly labelled.

## Architecture and code

- [ ] The change follows an existing module boundary or defines a new module
      contract.
- [ ] Input is validated at the server boundary.
- [ ] Browser code contains no privileged client or secret.
- [ ] Durable decisions are recorded in an ADR.
- [ ] No unrelated work is included.

## Data and security

- [ ] Tenant and company ownership are explicit.
- [ ] New public tables have RLS and least-privilege grants.
- [ ] Read and write policies cover positive and negative cases.
- [ ] Migrations are forward-only and tested.
- [ ] Privileged changes are audited where required.
- [ ] Privacy, retention, export, and deletion impact is reviewed.
- [ ] Supabase security advisors have no new findings.

## Quality

- [ ] `npm run docs:check` passes.
- [ ] `npm run verify:release` passes.
- [ ] Relevant RLS, E2E, integration, and manual tests pass.
- [ ] Regression tests cover the root cause of a fix.
- [ ] Accessibility and performance impact is acceptable.

## Operations

- [ ] Environment variables are documented and correctly scoped.
- [ ] Provider failure, timeout, retry, and idempotency are defined.
- [ ] Monitoring/alerts and operational owner are identified.
- [ ] Deployment and rollback are documented.
- [ ] Production smoke test steps are known.

## Delivery

- [ ] `CHANGELOG.md` is updated.
- [ ] CI and Preview pass.
- [ ] Required migration plan is reviewed.
- [ ] Review feedback is resolved.
- [ ] Production deployment is from reviewed `main`.
- [ ] Production status/runbook is updated after release.
- [ ] Post-release errors and success measures are checked.
