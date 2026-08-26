# Developer Setup

**Owner:** Engineering
**Review trigger:** Runtime, dependency, CLI, or onboarding change
**Last reviewed:** 2026-07-27

## Prerequisites

- Node.js 24 and npm 11 (`.nvmrc` and `package.json` are authoritative).
- Git and GitHub CLI.
- Vercel CLI for deployment work.
- Supabase CLI for local database and migration work.
- Access to the approved GitHub, Supabase, and Vercel projects.

## First setup

```bash
nvm use
npm ci
npm run setup:repo
cp .env.example .env.local
npm run supabase:login
npm run supabase:link
npm run verify:targets
npm run docs:check
```

Fill `.env.local` with approved development values. It is ignored by Git.
Never copy a production server secret into Preview or client-visible
variables.

## Start the application

```bash
npm run whereami
npm run dev
```

Open `http://localhost:3000`. The shared login route is `/en/login`.

## Setup verification

```bash
npm run docs:check
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

For database work:

```bash
npm run test:rls
npm run supabase:plan
```

For browser work:

```bash
npm run test:e2e
```

Authenticated E2E tests require the documented `E2E_*` variables.

## Next.js version rule

This repository uses Next.js 16.3.3 and may differ from older App Router
knowledge. Before changing framework behavior, read the relevant guide under:

```text
node_modules/next/dist/docs/
```

Follow deprecation notices in the installed version rather than relying on
memory or generic examples.

## Common setup failures

| Symptom                             | Check                                                       |
| ----------------------------------- | ----------------------------------------------------------- |
| Wrong repository or database        | `npm run whereami`                                          |
| Push blocked                        | `npm run setup:repo`; verify `origin`                       |
| Supabase commands target nothing    | `npm run supabase:login` and `npm run supabase:link`        |
| Provisioning disabled locally       | Set server-only `SUPABASE_SECRET_KEY`                       |
| Build lacks Supabase config         | Check URL and publishable key in `.env.local`               |
| Auth email redirects to localhost   | Update Supabase Site URL and allowed redirects              |
| Vercel deploy targets wrong project | Inspect `.vercel/project.json`; run `npm run verify:deploy` |
