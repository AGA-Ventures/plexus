# Plexus Documentation Hub

This directory is the operating system for product planning, engineering,
delivery, security, and production operations.

## Documentation layers

| Layer              | Questions answered                                      | Entry point                                                                    |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Product            | Why Plexus exists and what it should do                 | [Vision and scope](product/vision-and-scope.md)                                |
| Role guide         | What each role can do and how workflows connect         | [Features by role and use case](product/features-by-role-and-use-cases.md)     |
| Capabilities       | Which superapp modules exist or are planned             | [Capability map](product/capability-map.md)                                    |
| Architecture       | How modules, routes, identity, and data fit together    | [System overview](architecture/system-overview.md)                             |
| Database           | What the live Supabase schema contains                  | [Database schema](architecture/database-schema.md)                             |
| Development        | How to set up, navigate, and change the codebase        | [Developer setup](development/setup.md)                                        |
| Project management | How work moves from idea to production                  | [Operating model](project-management/operating-model.md)                       |
| Planning           | What is now, next, later, and blocked                   | [Roadmap](project-management/roadmap.md)                                       |
| Version control    | How versions, branches, tags, and releases are governed | [Versioning and releases](project-management/versioning-and-releases.md)       |
| Quality            | How behavior and release readiness are verified         | [Testing strategy](quality/testing.md)                                         |
| Operations         | How to deploy, monitor, recover, and support            | [Deployment](operations/deployment.md)                                         |
| Security           | How identity, tenancy, RLS, and secrets are protected   | [Authorization and data security](security/authorization-and-data-security.md) |
| Reference          | Current state, commands, and shared vocabulary          | [Project status](reference/project-status.md)                                  |

## Source-of-truth rules

| Subject                         | Canonical source                     | Documentation responsibility |
| ------------------------------- | ------------------------------------ | ---------------------------- |
| Product intent                  | `docs/product/`                      | Product owner                |
| Work priority                   | `docs/project-management/roadmap.md` | Product/engineering leads    |
| Routes and application behavior | `app/`, `proxy.ts`, server actions   | Feature owner                |
| Database schema and RLS         | `supabase/migrations/`               | Migration author             |
| Deployment targets              | `.deployment-targets.json`           | Release owner                |
| Environment contract            | `.env.example`                       | Feature/release owner        |
| Verification commands           | `package.json`, CI workflow          | Engineering owner            |
| Durable production state        | `docs/reference/project-status.md`   | Release owner                |
| Change history                  | `CHANGELOG.md`                       | Every contributor            |

Executable code, committed migrations, and machine-readable configuration win
when documentation differs. The discrepancy must be corrected in the same
change; it is not permission to leave documentation stale.

## Documentation lifecycle

Every canonical document states its owner or update trigger. Update the
relevant document when a change affects its claims. Run:

```bash
npm run docs:check
```

The checker validates required documents, headings, and local Markdown links.
Generated build output, dependencies, and active design-review artifacts are
excluded.

## Templates

- [Feature plan](templates/feature-plan.md)
- [Architecture decision record](templates/architecture-decision-record.md)
- [Release checklist](templates/release-checklist.md)
- [Incident report](templates/incident-report.md)

Copy a template into the relevant project-management or feature directory.
Do not edit the template itself for one-off work.
