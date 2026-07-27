# Versioning and Release Control

**Owner:** Engineering and release owner
**Review trigger:** Version, tagging, branch, or release policy change
**Last reviewed:** 2026-07-27

## Version model

Plexus uses semantic versions:

```text
MAJOR.MINOR.PATCH
```

- **MAJOR:** Incompatible public contract, data ownership, or supported
  workflow change.
- **MINOR:** Backward-compatible capability or module release.
- **PATCH:** Backward-compatible fix, security hardening, or operational
  improvement.

While the product is in controlled `0.x` delivery, increment MINOR for planned
capability milestones and PATCH for fixes. A `1.0.0` release requires the
operational-production milestone in the roadmap.

## Sources of release identity

| Artifact                    | Purpose                                 |
| --------------------------- | --------------------------------------- |
| `package.json` version      | Application release version             |
| Git commit SHA              | Exact source/build identity             |
| Git tag `vX.Y.Z`            | Reviewed release marker                 |
| `CHANGELOG.md`              | User/engineering-visible change history |
| Supabase migration versions | Ordered database history                |
| Vercel deployment ID        | Runtime artifact identity               |

A database migration version is not the application version. Record both in a
release when schema changed.

## Branch control

- `main` is the only production branch.
- Features and fixes use dedicated branches.
- Pull requests are required for production changes.
- CI and Preview must pass before merge.
- Only `origin` may receive pushes.
- Release scripts verify repository, commit, target, and clean state.

## Release procedure

1. Choose the next semantic version from delivered impact.
2. Move relevant changelog entries from `Unreleased` under the version/date.
3. Update `package.json` and lockfile version together.
4. Complete the release checklist and merge to `main`.
5. Apply compatible migrations in the documented order.
6. Deploy and verify Production.
7. Create the signed/annotated tag after successful verification:

   ```bash
   git tag -a vX.Y.Z -m "Plexus vX.Y.Z"
   git push origin vX.Y.Z
   ```

8. Record deployment ID, commit, migration range, and follow-up items.

Do not tag an unverified build or move an existing release tag.

## Hotfix

Branch from the current production commit, add a regression test, run the full
release gate, and merge through the normal review path. If urgent containment
requires rollback, rollback first and deliver the fix second.

## Database compatibility

- Prefer expand/migrate/contract for changes spanning multiple app versions.
- Deploy additive schema before code that requires it.
- Remove old columns/contracts only after all running code no longer uses them.
- Applied migrations are immutable.
- Every release with schema changes records the migration versions.
