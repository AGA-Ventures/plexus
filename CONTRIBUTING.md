# Contributing to Plexus

Plexus changes are delivered as complete vertical slices: product intent,
authorization, schema, application behavior, tests, operations, and
documentation move together.

## Before starting

1. Read the [documentation hub](docs/README.md).
2. Run `npm run whereami`.
3. Review the relevant product, architecture, security, and quality documents.
4. Start from reviewed `main` on a dedicated branch.

```bash
git switch main
git pull --ff-only
git switch -c feature/short-description
```

## Required change artifacts

| Change type   | Required artifacts                                    |
| ------------- | ----------------------------------------------------- |
| Feature       | Feature plan, code, tests, docs, changelog            |
| Database      | Migration, RLS review, schema docs, tests, changelog  |
| Security      | Threat/authorization notes, negative tests, changelog |
| Operations    | Runbook/deployment update, rollback path, changelog   |
| Documentation | Updated links/index, `npm run docs:check`, changelog  |

Use the templates in [`docs/templates/`](docs/templates/).

## Validation

```bash
npm run docs:check
npm run verify:release
```

Run `npm run test:e2e` when routes, authentication, responsive UI, or business
workflows change. Run `npm run test:rls` for database authorization changes.

## Pull requests

- Keep one coherent outcome per pull request.
- Explain the user impact and operational impact.
- Never mix unrelated local work into the change.
- Do not bypass the pre-push target guard.
- Production changes are merged into `main` only after CI and preview review.

The complete lifecycle and Definition of Done are documented in
[Project operating model](docs/project-management/operating-model.md) and
[Definition of Done](docs/quality/definition-of-done.md).
