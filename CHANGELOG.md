# Changelog

Every meaningful code, database, configuration, deployment, or documentation
change must be recorded here with its date. The change and changelog entry are
reviewed together.

## Unreleased

### 2026-07-27

- Added canonical GitHub, Supabase, and Vercel target definitions.
- Added repository setup, pre-push protection, live project status, release
  verification, and guarded deployment commands.
- Added development, deployment, and project-status runbooks.
- Pinned Supabase CLI `2.109.1`, initialized local Supabase configuration, and
  upgraded Next.js to security release `16.2.12`.
- Reconciled all 20 local Supabase migration filenames with the versions already
  recorded by the approved hosted project; live security advisors are clean.
- Created `main` in the canonical GitHub repository and made it the repository's
  default branch.
- Removed the obsolete Vercel Git connection; automatic deployment remains off
  until Vercel receives access to `AGA-Ventures/plexus`.
