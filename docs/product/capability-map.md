# Superapp Capability Map

**Owner:** Product and engineering leads
**Review trigger:** Capability delivery, retirement, or production-readiness change
**Last reviewed:** 2026-07-28

## Status definitions

| Status     | Meaning                                                    |
| ---------- | ---------------------------------------------------------- |
| Live       | Deployed, persisted, authorized, and verified              |
| Controlled | Live for approved users with a manual operational step     |
| Adapter    | UI/data contract exists; production provider is incomplete |
| Planned    | Accepted direction, not delivered                          |

## Platform capabilities

| Domain           | Capability                                      | Status          | Primary implementation               |
| ---------------- | ----------------------------------------------- | --------------- | ------------------------------------ |
| Identity         | Shared email/password login and logout          | Live            | Supabase Auth, `app/actions/auth.ts` |
| Identity         | Superadmin/Admin/Vendor route isolation         | Live            | `proxy.ts`, `lib/authorization.ts`   |
| Identity         | Admin and Vendor account provisioning           | Controlled      | Auth Admin API, management actions   |
| Identity         | Self-service password recovery                  | Controlled      | Supabase Auth email and PKCE flow    |
| Identity         | Invitation email and first-time password setup  | Planned         | Supabase Auth email flow             |
| Tenancy          | Admin tenant lifecycle and branding             | Live            | `admin_tenants`, Superadmin console  |
| Tenancy          | Vendor ownership and cross-tenant transfer      | Live            | `vendor_companies`, audited RPC      |
| Onboarding       | Delegation and Partner company profiles         | Live            | subtype tables and Vendor workspace  |
| Discovery        | Opposite-subtype candidate directory            | Live            | `match_candidate_directory`          |
| Matching         | Match request, decision, score, and status      | Live            | `matches`                            |
| Meetings         | Scheduling and meeting state                    | Live            | `meetings`                           |
| Meetings         | External meeting provider automation            | Adapter         | Zoom/Lark server adapters; deploy pending |
| Deals            | Deal/MOU state and signatory checks             | Live            | `deals`                              |
| Deals            | E-signature and document lifecycle              | Adapter         | Document reference fields            |
| Event operations | Itineraries, site visits, liaison, interpreters | Live            | Tenant-scoped operational tables     |
| Communications   | Announcements and notifications                 | Live data model | Tenant-scoped tables                 |
| Communications   | Transactional email/push delivery               | Adapter         | API routes/provider pending          |
| Resources        | Private resource metadata and uploads           | Live            | Storage bucket and API routes        |
| Compliance       | SSM/CTOS/World-Check interface                  | Adapter         | Protected compliance routes          |
| Governance       | Platform settings and provisioning controls     | Live            | `platform_settings`                  |
| Governance       | Append-only privileged audit events             | Live            | `audit_events` and triggers          |
| Reporting        | Operational dashboard summaries                 | Controlled      | Existing portal views                |
| Observability    | Error tracking, uptime, product analytics       | Planned         | Provider selection pending           |
| AI               | Future Plexus assistant experience              | Concept         | `/app` showcase only                 |

## Superapp module boundaries

The capability map groups into modules with independent ownership:

1. Platform shell and localization
2. Identity and tenancy
3. Vendor onboarding and profiles
4. Directory and matching
5. Meetings and interpreters
6. Deals and documents
7. Event and itinerary operations
8. Communications and resources
9. Compliance
10. Platform governance and audit
11. Analytics and observability
12. AI assistance

Each module must satisfy the module contract in
[System architecture](../architecture/system-overview.md) before being called
production-ready.

## Production honesty rule

A polished screen is not proof of a live capability. A capability is `Live`
only when its persistent data, authorization, external provider (when needed),
failure behavior, tests, monitoring, support procedure, and owner are known.
