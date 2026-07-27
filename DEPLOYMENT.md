# Plexus Deployment Guide

The approved deployment destinations are defined in
`.deployment-targets.json`. Scripts fail closed when the local configuration
does not match that file.

## Approved destinations

| System   | Approved target                               | Production rule                         |
| -------- | --------------------------------------------- | --------------------------------------- |
| GitHub   | `AGA-Ventures/plexus`                         | Only remote `origin` may receive pushes |
| Supabase | `Plexus` / `pnjblggcdigekluualin`             | Migrations are manual and confirmed     |
| Vercel   | `plexus` / `prj_FUkKgAm7UXkFGTgmtFM8ynaSHKuE` | Production comes from `main`            |

## Current automatic-deployment state

Automatic Vercel Git deployment is intentionally off. The old
`CSTAN-ULTIMATELYSOLUTION/plexus` connection was removed, and Vercel could not
connect the new repository because its GitHub integration does not yet have
write/admin access to `AGA-Ventures/plexus`.

One-time fix:

1. In the Vercel GitHub integration settings, grant access to
   `AGA-Ventures/plexus`.
2. Ensure the new GitHub repository has a `main` branch.
3. Run:

   ```bash
   vercel git connect https://github.com/AGA-Ventures/plexus
   npm run verify:deploy
   ```

When verification passes, feature branches create previews and `main` creates
production deployments.

## Safe release sequence

1. Update `CHANGELOG.md` in the same pull request as the change.
2. Run `npm run verify:release`.
3. Push the feature branch to `origin`.
4. Review CI and the preview deployment.
5. If migrations changed, run `npm run supabase:plan`.
6. Merge the reviewed pull request into `main`.
7. Run `npm run supabase:push` before promoting app code that depends on the new
   schema.
8. Confirm the Vercel production deployment and perform a smoke test.

Database changes are not automatically coupled to Git pushes. This prevents an
unreviewed migration from reaching production.

## Manual Vercel fallback

Use this only while Git integration is unavailable:

```bash
npm run deploy:preview
npm run deploy:production
```

Both commands require a clean working tree, require the exact commit to exist
on the approved GitHub repository, run release verification, and require typed
confirmation. Production is blocked outside `main`.

## Environment-variable policy

- `.env.local` and `.vercel/` stay untracked.
- `SUPABASE_SECRET_KEY` is server-only and production-only on Vercel.
- Preview deployments receive the Supabase URL and publishable key, but not the
  production server secret.
- Vercel Development variables are intentionally not used; local development
  uses the ignored `.env.local`.
- Re-run `npm run verify:deploy` after changing Vercel Git or environment
  settings.

## Dependency-audit status

`npm audit` currently reports high-severity findings inherited from the latest
stable Next.js `16.2.12`: Next.js vendors an older build-time PostCSS and
resolves Sharp `0.34.x`. The Next.js maintainers state that the PostCSS finding
does not affect normal Next.js users because it runs only while building trusted
source. The Sharp upgrade is still being tracked upstream, and this project does
not allow remote image sources.

Do not run `npm audit fix --force`; npm proposes an unsafe Next.js downgrade.
`npm run verify:release` blocks critical findings, and the remaining upstream
findings must be reviewed whenever Next.js publishes a new stable release:

- https://github.com/vercel/next.js/issues/93234
- https://github.com/vercel/next.js/issues/96064

## Rollback

- App only: use Vercel rollback to the last known-good deployment.
- Database: create and review a forward-fix migration. Do not delete migration
  history or rewrite an applied migration.
- Record the incident and fix in `CHANGELOG.md`.
