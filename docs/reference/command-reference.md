# Command Reference

**Owner:** Engineering
**Review trigger:** `package.json` script or release-command change
**Last reviewed:** 2026-07-27

## Orientation and setup

| Command                  | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| `npm run whereami`       | Show branch, targets, environment, and links |
| `npm run setup:repo`     | Configure approved push behavior/hooks       |
| `npm run supabase:login` | Authenticate Supabase CLI                    |
| `npm run supabase:link`  | Link the approved Plexus project             |

## Development

| Command          | Purpose                                |
| ---------------- | -------------------------------------- |
| `npm run dev`    | Start Next.js development server       |
| `npm run build`  | Build optimized production application |
| `npm run start`  | Start an existing production build     |
| `npm run format` | Format TypeScript/TSX                  |

## Documentation and quality

| Command                  | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `npm run docs:check`     | Validate required docs, headings, and links |
| `npm run lint`           | ESLint                                      |
| `npm run typecheck`      | TypeScript without emitting                 |
| `npm run test:unit`      | Vitest unit suite                           |
| `npm run test:watch`     | Vitest watch mode                           |
| `npm run test:e2e`       | Playwright suite                            |
| `npm run test:rls`       | Local Supabase pgTAP tests                  |
| `npm run verify:release` | Full standard release gate                  |

## Supabase

| Command                           | Purpose                                     |
| --------------------------------- | ------------------------------------------- |
| `npx supabase migration new NAME` | Create correctly named migration            |
| `npm run supabase:plan`           | Verify target and dry-run migration plan    |
| `npm run supabase:push`           | Confirm and apply migrations, then advisors |
| `npm run supabase:advisors`       | Run linked security/performance advisors    |

Discover current CLI syntax before using an unfamiliar command:

```bash
supabase --help
supabase <group> --help
```

## Vercel

| Command                                                | Purpose                                            |
| ------------------------------------------------------ | -------------------------------------------------- |
| `npm run verify:deploy`                                | Verify project, Git repository, branch, env scopes |
| `npm run deploy:preview`                               | Guarded manual Preview deployment                  |
| `npm run deploy:production`                            | Guarded manual Production deployment               |
| `vercel ls`                                            | List deployments                                   |
| `vercel inspect URL`                                   | Inspect deployment                                 |
| `vercel logs URL --level error --since 1h --no-branch` | Inspect errors                                     |
| `vercel rollback`                                      | Roll back Production application                   |

## Account bootstrap

| Command                        | Purpose                            |
| ------------------------------ | ---------------------------------- |
| `npm run bootstrap:superadmin` | Guarded first Superadmin bootstrap |

Normal Admin provisioning and Vendor approval happen through protected
management workspaces. The public Vendor application route creates only a
pending review record, never an Auth account.

## Production verification

```bash
E2E_BASE_URL=https://production.example \
  node --env-file=.env.local scripts/verify-production-roles.mjs
```

This creates temporary QA accounts/data and removes them. Run only with
approved credentials and confirm the cleanup PASS message.
