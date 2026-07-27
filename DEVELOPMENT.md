# Plexus Development Guide

This is the daily workflow for developing Plexus without losing track of the
active branch, deployment destination, database, or change history.

## Canonical targets

The machine-readable source of truth is `.deployment-targets.json`.

- GitHub: `AGA-Ventures/plexus`
- Git remote used for every push: `origin`
- Production branch: `main`
- Supabase: `Plexus` (`pnjblggcdigekluualin`)
- Vercel: `plexus` (`prj_FUkKgAm7UXkFGTgmtFM8ynaSHKuE`)

Run this whenever you are unsure where you are:

```bash
npm run whereami
```

## First setup on a machine

```bash
nvm use
npm ci
npm run setup:repo
cp .env.example .env.local
npm run supabase:login
npm run supabase:link
npm run verify:targets
```

Fill only `.env.local`; it is ignored by Git. Never commit a real server secret,
password, access token, or `.local` environment file.

## Start a work session

```bash
nvm use
npm ci
npm run whereami
npm run dev
```

Create a feature branch from the latest reviewed `main`. Do not develop
directly on `main`.

```bash
git switch main
git pull --ff-only
git switch -c feature/short-description
```

## While developing

For every meaningful code, database, configuration, or documentation change:

1. Make and test the change.
2. Add a dated line under `Unreleased` in `CHANGELOG.md`.
3. Run `npm run verify:release`.
4. Commit the code and changelog together.
5. Run `git push -u origin HEAD`.

The tracked pre-push hook blocks every repository except
`AGA-Ventures/plexus`. Do not bypass it with `--no-verify`.

## Database changes

Never edit the hosted database first and hope to remember the change later.
Create a migration:

```bash
npx supabase migration new short_description
```

Edit the generated SQL file, test locally, and review the remote plan:

```bash
npm run test:rls
npm run supabase:plan
```

Only after the migration commit is pushed and reviewed:

```bash
npm run supabase:push
```

The push command checks the linked project, performs a dry run, requires the
exact project reference as confirmation, applies migrations, and runs database
advisors.

## Environment variables

| Variable                               | Browser-visible | Local               | Preview        | Production     | Purpose                            |
| -------------------------------------- | --------------- | ------------------- | -------------- | -------------- | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Yes             | Required            | Required       | Required       | Approved Supabase API URL          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes             | Required            | Required       | Required       | Public client key protected by RLS |
| `SUPABASE_SECRET_KEY`                  | No              | Privileged tasks    | No             | Required       | Server-only account administration |
| `PLEXUS_SUPERADMIN_NAME`               | No              | Bootstrap only      | No             | No             | One-time local bootstrap           |
| `PLEXUS_SUPERADMIN_EMAIL`              | No              | Bootstrap only      | No             | No             | One-time local bootstrap           |
| `PLEXUS_SUPERADMIN_PASSWORD`           | No              | Bootstrap only      | No             | No             | One-time local bootstrap           |
| `E2E_*`                                | No              | Authenticated tests | Optional       | No             | Test accounts only                 |
| `VERCEL_OIDC_TOKEN`                    | No              | Auto-generated      | Auto-generated | Auto-generated | Short-lived Vercel identity        |

`NEXT_PUBLIC_*` values are compiled into browser JavaScript. They must never
contain secrets. The Supabase publishable key is intentionally public; RLS is
the security boundary.

## Before opening a pull request

```bash
npm run whereami
npm run verify:release
git status
```

Use the pull-request checklist. The change and its dated `CHANGELOG.md` entry
belong in the same commit or pull request.
