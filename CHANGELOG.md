# Changelog

Every meaningful code, database, configuration, deployment, or documentation
change must be recorded here with its date. The change and changelog entry are
reviewed together.

## Unreleased

### 2026-07-28

- Refined the login form surface into a more transparent glass panel with
  stronger backdrop blur, subtle neutral tinting, and lighter edge definition.
- Replaced the generic login ribbon with original ImageGen artwork derived
  directly from the Plexus X mark, using its electric-blue, cyan, and gold
  connection motif.
- Redesigned login as a responsive Plexus superapp experience, removed exposed
  infrastructure and route details, and added server-resolved white-label Admin
  tenant branding with tenant-bound sign-in validation.
- Added tenant login logo management, safe public logo URL validation, and
  platform/tenant login coverage in unit and browser tests.
- Added a current-state application feature guide covering the Superadmin,
  Admin, Delegation Vendor, and Partner Vendor layers, with permission
  matrices, use-case diagrams, routes, authorization boundaries, and explicit
  live/controlled/adapter/simulation status.

### 2026-07-27

- Reorganized project knowledge into a layered `docs/` operating system for
  product, architecture, development, project management, quality, operations,
  security, and reference material.
- Added a live-schema-based database catalog, ER model, RLS summary, module
  boundaries, delivery roadmap, reusable planning templates, and documentation
  validation.
- Made documentation validation part of the standard release and CI gates.
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
