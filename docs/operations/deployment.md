# Deployment and Release

**Owner:** Release owner
**Review trigger:** Hosting, target, environment, branch, or release change
**Last reviewed:** 2026-08-26

The machine-readable destinations are in `.deployment-targets.json`. Release
scripts fail closed when the checkout points elsewhere.

## Approved production targets

| System   | Target                                        | Production rule                    |
| -------- | --------------------------------------------- | ---------------------------------- |
| GitHub   | `AGA-Ventures/plexus`                         | Push only through `origin`         |
| Supabase | `Plexus` / `pnjblggcdigekluualin`             | Confirmed, forward-only migrations |
| Vercel   | `plexus` / `prj_vQpMXPAmIiSrED4IB0s1ZqAwDD0C` | Deploy reviewed `main`             |

Current public production alias:

```text
https://plexus-gules.vercel.app
```

## Current automation state

The Vercel Git integration points to `AGA-Ventures/plexus`, `main` is the
production branch, required Supabase variable scopes pass the read-only target
check, and the latest `main` Production deployment is `READY`. The public alias
returned HTTP 200 on 2026-08-26. A fresh feature-branch Preview-to-production
run is still required as repeatable release evidence.

Verification sequence:

1. Run:

   ```bash
   npm run verify:deploy
   ```

2. Confirm feature branches create Preview deployments and `main` creates
   Production deployments in the approved project.
3. Record the Preview URL, production deployment ID, commit, and smoke-test
   evidence in the release record and project status.

## Release sequence

1. Update code, tests, docs, and `CHANGELOG.md`.
2. Run `npm run docs:check` and `npm run verify:release`.
3. Push a feature branch to `origin`.
4. Review CI and Preview.
5. If migrations changed, review `npm run supabase:plan`.
6. Merge the reviewed pull request to `main`.
7. Apply required migrations before dependent app code is promoted.
8. Confirm the Vercel Production deployment.
9. Run public/protected route smoke tests.
10. Run the production role verifier when authorization/provisioning changed.
11. Inspect runtime errors and update project status.

Database migrations are intentionally not coupled automatically to every Git
push.

## Manual Vercel fallback

If the automatic Git path needs controlled recovery:

```bash
npm run deploy:preview
npm run deploy:production
```

The scripts require:

- A clean worktree.
- The exact commit on the approved GitHub remote.
- Production deployments from `main` only.
- Passing release verification.
- Typed confirmation.

If the active checkout contains unrelated work, deploy from a clean temporary
worktree rather than stashing, overwriting, or committing that work.

## Environment policy

- `.env.local` and `.vercel/` are untracked.
- Public Supabase variables exist in Preview and Production.
- `SUPABASE_SECRET_KEY` exists only in Production.
- Local development uses `.env.local`.
- Set `NEXT_PUBLIC_SITE_URL` when a canonical branded domain is established.
- Configure the exact Site URL and `/auth/callback` redirects for local,
  Preview, and Production origins in Supabase Auth.
- Treat `supabase/templates/recovery.html` as the version-controlled source for
  the recovery email. Hosted Supabase does not read this local file: copy its
  HTML and the subject `Reset your Plexus password` into **Authentication >
  Email Templates > Reset password** for the approved project.
- Configure custom SMTP with
  `Plexus <notifications@info.plexus.enterprises>`. The built-in sender displays
  `Supabase Auth`, is restricted, and is not suitable for external
  Admin/Vendor recipients.
- Disable provider link tracking for Auth email, configure SPF, DKIM, and DMARC,
  and verify the recovery CTA and plain-link fallback in major mail clients.
- New Free projects using Supabase's default SMTP cannot customize Auth email
  templates; use a paid project or custom SMTP before promoting this branding.
- Send a password-recovery message to an approved test account and verify that
  the sender, subject, Plexus wordmark, reset link, and forced re-login all work
  before broad release.
- Run `npm run verify:deploy` after Vercel Git/environment changes.

See [Environment variables](../development/environment-variables.md).

## Post-deploy checks

```bash
curl -I https://production.example/
curl -I https://production.example/en/login
curl -I https://production.example/en/forgot-password
curl -I https://production.example/en/reset-password
curl -I https://production.example/en/admin
curl -I https://production.example/en/superadmin
curl -I https://production.example/en/vendor

vercel inspect https://deployment-url
vercel logs https://deployment-url --level error --since 1h --no-branch
```

Expected anonymous behavior:

- `/` and `/en/login`: successful response.
- Protected routes: redirect to `/en/login?next=...`.

## Rollback

### Application-only

Use Vercel rollback or promote the last verified deployment:

```bash
vercel rollback
```

Verify routes and errors after rollback.

### Database

Create and review a forward-fix migration. Do not delete migration history,
rename an applied migration, or use destructive reset commands.

### Mixed application/database incident

Choose the safest compatible application version, stop further releases,
prepare a forward database fix, and follow the
[incident runbook](incident-response.md).

## Dependency advisories

The release gate blocks critical production findings. As of 2026-08-26, both
the full audit and `npm audit --omit=dev` report zero vulnerabilities after the
supported Next.js 16.3.3 and toolchain updates. Keep Next.js and
`eslint-config-next` aligned, prefer compatible parent-package upgrades, and do
not use `npm audit fix --force` to bypass framework compatibility.
