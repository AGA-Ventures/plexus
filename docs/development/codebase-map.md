# Codebase Map

**Owner:** Engineering
**Review trigger:** New top-level directory or module boundary
**Last reviewed:** 2026-07-27

## Repository map

```text
app/                    Next.js routes, APIs, Server Actions, layouts
components/             Product components and shared UI primitives
lib/                    Domain logic, authorization, data access, clients
public/                 Public static assets
supabase/migrations/    Canonical database and RLS history
supabase/templates/     Version-controlled Supabase Auth email HTML
supabase/tests/         pgTAP authorization tests
tests/                  Unit and Playwright tests
scripts/                Bootstrap, verification, deployment, QA utilities
docs/                   Product and engineering operating system
.github/                CI and collaboration templates
```

## Application boundaries

| Location                              | Responsibility                                         |
| ------------------------------------- | ------------------------------------------------------ |
| `app/[locale]/`                       | Localized public and protected pages                   |
| `app/actions/auth.ts`                 | Login/logout                                           |
| `app/actions/management.ts`           | Tenant, Vendor, user, setting, and transfer management |
| `app/actions/plexus.ts`               | Operational domain mutations                           |
| `app/api/admin/`                      | Protected Admin communications/resources APIs          |
| `app/api/compliance/`                 | Protected compliance adapters                          |
| `components/ui/`                      | Reusable visual primitives only                        |
| `components/superadmin-console.tsx`   | Platform control center                                |
| `components/admin-vendor-console.tsx` | Tenant Vendor management                               |
| `components/malayconnect-mvp.tsx`     | Main operational portal shell                          |
| `lib/auth.ts`                         | Claim parsing and role routing                         |
| `lib/authorization.ts`                | Active identity and database binding validation        |
| `lib/management-data.ts`              | Management read models                                 |
| `lib/plexus-data.ts`                  | Operational read models                                |
| `lib/supabase/`                       | Browser, server, and privileged clients                |
| `proxy.ts`                            | Protected-route session and role guard                 |

## Adding a module

1. Add the capability to `docs/product/capability-map.md`.
2. Complete the module contract in the feature plan.
3. Choose a clear server/domain boundary; do not put business logic in a page.
4. Add migrations and RLS before relying on new tables.
5. Add a domain data module under `lib/` when reads become non-trivial.
6. Add Server Actions or route handlers for validated writes.
7. Add UI under a module-specific component, using `components/ui/` primitives.
8. Add unit, RLS, integration, E2E, and operational verification as applicable.
9. Update architecture, schema, runbook, status, and changelog documentation.

## Naming and dependency conventions

- Routes and files use lowercase/kebab case where the framework permits.
- React components and TypeScript types use PascalCase.
- Functions and values use camelCase.
- Database identifiers use snake_case.
- Server-only clients must never be imported into Client Components.
- Avoid a generic `utils` dumping ground for domain behavior.
- Prefer module-specific types and queries over large cross-domain objects.
- Keep `app_metadata` as the only JWT authorization source.
