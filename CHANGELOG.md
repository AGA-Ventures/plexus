# Changelog

Every meaningful code, database, configuration, deployment, or documentation
change must be recorded here with its date. The change and changelog entry are
reviewed together.

## Unreleased

### 2026-07-28

- Automated provider meeting creation when the second Vendor accepts, added a
  unique service-only creation job to prevent duplicate provider calls, and
  surfaced sanitized creation failures as critical Superadmin incidents with
  audited, capped retry while preserving the Vendors' agreement.
- Reconciled the automatic meeting incident migration filename with the
  `20260727193452` version already recorded by the hosted Plexus database.
- Added an Admin meeting-operations dashboard with zero-state totals, the full
  tenant-scoped meeting list, visible Zoom/Lark readiness, and a dedicated
  Meeting settings sidebar destination that reports server configuration,
  protected-link readiness, and Lark authorization without exposing secrets.
- Removed the internal tenant-scope and persistence notices from the Admin
  dashboard so operational content begins immediately below the metrics.
- Replaced the Admin dashboard's four-button utility strip with dedicated
  sidebar links for Vendor accounts and Compliance; kept Vendor provisioning
  inside Vendor accounts and tenant branding inside account settings.
- Reused each Admin tenant's white-label logo in the account control and
  account-settings identity panel, with operator initials retained as a
  resilient fallback.
- Removed Supabase product naming from customer-facing account-settings copy
  while preserving the profile, access, recovery, and session meaning.
- Limited the protected account language selector to the four fully translated
  portal routes: English, Simplified Chinese, Traditional Chinese, and Thai.
- Replaced the native Vendor-subtype select with a branded, accessible picker
  that explains Delegation and Partner roles and keeps the chosen subtype
  visible before account creation.
- Required separate Delegation and Partner acceptance before a match can
  advance, enforced each Vendor's own decision at the database boundary, and
  removed Admin acceptance on behalf of Vendors.
- Added server-only Zoom and Lark meeting creation, one-time Lark host OAuth
  with refresh-token rotation, expiring opaque Plexus join links, concurrent
  access counting, RLS-locked token/raw-link tables, Admin provider controls,
  deployment documentation, and provider/gate/RLS tests.
- Fixed the Admin portal runtime crash by passing the protected Zoom/Lark
  meeting-creation callback through the `AdminPortal` component boundary and
  removing the superseded Admin matching callbacks.
- Expanded the Admin/Vendor user-profile popup into a responsive account
  settings workspace with Profile, tenant-scoped White label, and Access
  sections; removed raw user/tenant IDs; added safe self display-name editing;
  and embedded logo upload, login preview, language, recovery, and session
  controls.
- Clarified the public support-email and private Admin-login-email purposes in
  Admin provisioning, and required a matching temporary-password confirmation
  in both the form and Server Action.
- Added direct, tenant-scoped login-logo uploads to a constrained public
  Supabase Storage bucket, an immediate logo preview in tenant settings, and an
  authenticated sign-in-disabled login-page preview for Superadmins and Admins.
- Replaced the Superadmin console's horizontal section tabs with the same
  responsive desktop sidebar and mobile navigation pattern used by Admin, and
  added an audited tenant-row action that sends active Admins a Supabase
  password recovery link without exposing or overwriting their password.
- Replaced the generic Supabase password-recovery message with a
  version-controlled, responsive Plexus security email, plus a safe local
  preview and hosted SMTP/template deployment guidance.
- Added tenant-aware self-service password recovery with a generic public
  response, Supabase PKCE callback exchange, verified password update, and
  return to the branded login.
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
