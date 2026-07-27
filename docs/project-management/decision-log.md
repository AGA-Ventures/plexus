# Architecture Decision Log

**Owner:** Engineering lead
**Review trigger:** Durable or expensive-to-reverse decision
**Last reviewed:** 2026-07-27

Architecture Decision Records (ADRs) explain why the system took a direction
so future work does not reopen the same question without new evidence.

## When an ADR is required

Create an ADR when changing:

- Authorization, tenancy, identity, or trust boundaries.
- Database ownership or cross-module data flow.
- Runtime, hosting, database, storage, or major provider.
- Module boundaries or an extraction into another service.
- Public API or domain event contracts.
- Data retention, encryption, privacy, or compliance posture.
- A choice that is difficult or costly to reverse.

Small implementation details do not need an ADR.

## Status

- `Proposed`
- `Accepted`
- `Superseded`
- `Rejected`
- `Deprecated`

## Naming

Copy the [ADR template](../templates/architecture-decision-record.md) to the
[architecture decisions directory](decisions/):

```text
docs/project-management/decisions/NNNN-short-title.md
```

Use the next four-digit number. Link superseding decisions in both records.

## Accepted decisions

| ADR     | Decision                                                                                  | Status |
| ------- | ----------------------------------------------------------------------------------------- | ------ |
| Pending | The current architecture predates this log; create ADRs when these boundaries next change | —      |

## Existing architectural baselines

Until formalized by a change-specific ADR, these committed baselines apply:

- Modular monolith on Next.js/Vercel.
- Supabase Auth, PostgreSQL, RLS, and private Storage.
- `superadmin`, `admin`, and `vendor` as the top-level roles.
- Delegation and Partner as Vendor subtypes.
- Trusted `app_metadata` plus exact active relational bindings.
- Manual, confirmed database migrations separate from application pushes.

An ADR does not replace code, migrations, tests, or runbooks. It records the
decision and consequences.
