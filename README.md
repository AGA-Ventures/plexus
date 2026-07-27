# Plexus Connect

Plexus is a multilingual, multi-tenant business operations superapp for
Malaysia–China/Macao matching, onboarding, meetings, deals, event operations,
communications, resources, and compliance.

## Start here

```bash
nvm use
npm ci
cp .env.example .env.local
npm run setup:repo
npm run whereami
npm run dev
```

`npm run whereami` shows the active Git branch, push destination, Supabase
target, local environment state, Vercel project, and change log.

## Documentation

The [documentation hub](docs/README.md) is the repository operating system.
Use these entry points:

- [Product vision and scope](docs/product/vision-and-scope.md)
- [Capability map](docs/product/capability-map.md)
- [System architecture](docs/architecture/system-overview.md)
- [Database schema](docs/architecture/database-schema.md)
- [Routes and access model](docs/architecture/routes-and-access.md)
- [Developer setup](docs/development/setup.md)
- [Development workflow](docs/development/workflow.md)
- [Project operating model](docs/project-management/operating-model.md)
- [Roadmap and backlog](docs/project-management/roadmap.md)
- [Testing strategy](docs/quality/testing.md)
- [Deployment runbook](docs/operations/deployment.md)
- [Security model](docs/security/authorization-and-data-security.md)
- [Current project status](docs/reference/project-status.md)
- [Change history](CHANGELOG.md)

See [CONTRIBUTING.md](CONTRIBUTING.md) before changing code, schema,
configuration, or documentation.

## Platform workspaces

| Workspace         | Route                     | Purpose                                        |
| ----------------- | ------------------------- | ---------------------------------------------- |
| Shared login      | `/[locale]/login`         | Email/password authentication and role routing |
| Superadmin        | `/[locale]/superadmin`    | Platform and cross-tenant control              |
| Admin             | `/[locale]/admin`         | Tenant operations                              |
| Vendor management | `/[locale]/admin/vendors` | Tenant-scoped Vendor provisioning              |
| Vendor            | `/[locale]/vendor`        | Delegation and Partner Vendor workspace        |
| Compliance        | `/[locale]/compliance`    | Protected compliance operations                |

Vendor types `delegation` and `partner` are subtypes of the `vendor` role.
Legacy subtype routes redirect to the unified Vendor workspace. Supported
locales are `en`, `zh`, `zh-Hant`, and `th`; `cn` aliases to `zh`.

## Required verification

```bash
npm run docs:check
npm run verify:release
npm run test:e2e
```

The release gate verifies documentation links, approved deployment targets,
production dependencies, lint, TypeScript, unit tests, and the Next.js
production build.
