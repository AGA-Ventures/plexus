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
- [Development Command Center](docs/development/plexus-command-center.html)
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

## Secure Zoom and Lark meeting links

Meeting creation is allowed only after the Delegation Vendor and Partner Vendor
have each accepted the match. The second acceptance moves the pair to **Pending
meeting** without creating a provider session. One Vendor proposes an
Admin-published date and time, the counterpart approves that exact proposal,
and the database creates one shared meeting only after both approval actors and
timestamps exist. The owning Admin then confirms Zoom or Lark; Plexus shares
only an expiring `NEXT_PUBLIC_APP_URL/m/<opaque-slug>` link. The raw provider
join URL remains in a server-only, RLS-locked table. A provider failure
preserves the agreement and raises a sanitized critical incident for
Superadmin retry.

Release setup:

1. Add the Supabase, Zoom, Lark, and `NEXT_PUBLIC_APP_URL` variables from
   `.env.example` to the appropriate Vercel environments.
2. Review `npm run supabase:plan` and apply every pending migration before
   deploying dependent application code, including the secure-link, creation
   job, tenant-availability, and mutual meeting-approval migrations.
3. While signed in as a Superadmin, visit `/api/lark/login` once and approve
   the platform Lark host authorization.
4. After both Vendors accept and approve the meeting time, the owning operator
   confirms the provider through the protected workflow. `POST /api/meetings`
   remains the controlled provider-creation boundary:

   ```json
   {
     "matchId": "<match-uuid>",
     "provider": "zoom",
     "topic": "Partner introduction",
     "durationMinutes": 60
   }
   ```

The API response contains `shareUrl` and `expiresAt`; it never contains the raw
provider URL or a Zoom host URL.

## Required verification

```bash
npm run docs:command-center
npm run health:check
```

The command-center refresh inventories the current Markdown and App Router
surface. The health gate then verifies documentation freshness, approved
deployment targets, production dependencies, lint, TypeScript, unit tests, the
Next.js production build, and desktop/mobile Playwright coverage. Run
`npm run test:rls` separately whenever the Supabase CLI and local database are
available.
