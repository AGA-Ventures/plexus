# Changelog

Every meaningful code, database, configuration, deployment, or documentation
change must be recorded here with its date. The change and changelog entry are
reviewed together.

## Unreleased

### 2026-07-29

- Added approval-gated tenant Vendor onboarding. Every active Admin now has
  separate branded Delegation and Partner application links; applicants submit
  the existing company-profile contract at 100% core completion without
  creating Auth/Vendor records or uploading files. The owning Admin can review
  the complete profile, atomically approve or reject it, and resend a
  tenant-aware one-time password-setup email. Approval creates trusted Auth,
  canonical/subtype Vendor, and profile bindings with cleanup on partial
  failure. A new RLS-protected `vendor_applications` migration, shared profile
  persistence mapper, setup-password mode, API abuse controls, unit/RLS/E2E
  coverage, runbook updates, and ADR document the new public trust boundary.
- Hardened the global theme keyboard shortcut against malformed browser
  keyboard events so a missing `key` value cannot crash the workspace.
- Restricted Vendor application rejection to the trusted server workflow and
  added covering indexes for reviewer and resulting Auth relationships.
- Reduced the shared company-introduction minimum from 100 words to 10 words,
  retaining the 200-word maximum across public applications and Vendor
  profiles.
- Centered the success tick and Vendor subtype badge in the submitted
  application confirmation card.
- Hid all Compliance provider, configuration, route, payload, market, and
  screening information from the protected UI while keeping Compliance as an
  active destination in the shared responsive Admin sidebar; the hidden
  workspace now displays only a centered `Pending` status.
- Constrained Vendor-directory sectors to two lines, fixed the desktop table
  column layout, and stacked status controls so long sector names no longer
  push the Controls column out of view.

### 2026-07-28

- Fixed the industry sector picker overflowing its dialog and scrolling badly.
  The panel had a fixed 24rem list inside an unbounded popover, so on shorter
  screens it ran past the viewport and its lower entries could not be reached.
  It is now bounded by the space the browser actually has between the trigger
  and the screen edge, keeps a 16px margin from every edge, and contains its
  own wheel scrolling so it no longer scrolls the dialog behind it. The list
  also shows a scrollbar: it previously carried a `no-scrollbar` class that
  was never defined anywhere in the project, leaving a long list with no
  visible sign that it scrolled at all. Both the single and multi-select
  pickers are fixed, which covers Vendor provisioning, Superadmin and Admin
  company editing, the Vendor directory, and the registration profile.
- Made the Vendor provisioning form explain itself. Required fields now carry a
  marker with a screen-reader equivalent, the one optional field is labelled as
  such, and every field states its purpose: **Account holder** identifies the
  person who will sign in and manage the Vendor rather than the company,
  **Email** is now **Login email** and warns that an address already used by
  another Plexus account will be rejected, and the temporary password explains
  it is for the first sign-in and must be shared through a secure channel.
  Hints are wired to their inputs with `aria-describedby`.
- Made every Admin company-creation control provision a real Vendor account.
  **Add Delegation**, **Add MY Partner**, and **Add Company** previously wrote a
  company row with no login, so the resulting Vendor could never sign in, while
  a separate **Provision Vendor account** button created the company and its
  account together. All three now open the provisioning dialog; the two
  subtype-specific buttons preset and hold their subtype, and the generic
  button keeps the subtype picker — it had silently hardcoded delegation
  despite its label. The account-less creation path and its dead client
  plumbing were removed.
- Added a live countdown badge to every meeting card, calendar entry, and
  meeting details view. It counts down to the start, switches to the time
  remaining once the meeting is running, and reports how long ago a meeting
  ended, using the two most significant units so it stays readable from days
  away down to the final seconds. Completed and cancelled meetings show none.
  The clock is read through a subscription rather than during render, so
  server and client output agree.
- Stopped copied join links, Join buttons, and calendar exports from handing
  out the origin that happened to create the meeting. A meeting created against
  a development server stored an absolute `http://localhost:3000/m/...` URL and
  served it to everyone, including Vendors on production. The slug is now
  treated as the identity of a protected link and resolved against the host the
  viewer is actually on, while legacy external provider links are left
  untouched. Three stored production links were corrected to the production
  origin.
- Stopped the manual meeting dialog from stranding Admins behind a silently
  disabled **Create meeting** button. The footer now lists every outstanding
  requirement while the form is filled in, the agenda counter states its
  three-character minimum, and the button stays clickable so a click always
  answers what is missing with a specific message for the Vendor pair, the
  date and time, a past start, or a short agenda, instead of one combined
  sentence. The meeting details dialog reports a short agenda the same way.
- Resolved the conflict between Admin-arranged meetings and provider-link
  protection. The arranging Admin is the scheduling authority, so manual
  meeting creation now books the Zoom or Lark meeting and issues its protected
  join link immediately instead of withholding it until both Vendors accept.
  The override never accepts on a Vendor's behalf: acceptance columns stay
  empty, an undecided match keeps its `Proposed` status, and the database
  constraint and trigger that require mutual acceptance before a match may
  advance remain unchanged. When the provider is unreachable the meeting still
  reaches both calendars and the Admin receives an explicit warning that the
  link is missing. The Vendor-driven path, the `POST /api/meetings` route, and
  automatic creation after the second acceptance all keep their existing
  mutual-acceptance requirement.
- Allowed Admins to reschedule a provider-backed meeting instead of blocking
  the change. Amending the platform, date, or duration books a replacement
  provider meeting and issues a new slug, retiring the previous join link so it
  cannot outlive the schedule it was issued for; the details dialog states this
  before the change is saved, and a provider failure now leaves the original
  meeting and link untouched.
- Widened the protected join window so a link is usable in practice: it opens
  15 minutes before the start for early arrivals and expires 30 minutes after
  the scheduled end for meetings that run over, replacing a window that was
  valid only between the exact start and end times.

- Added a real Admin MOU workflow: tenant operators can create one agreement
  from an existing Vendor match, move it through signing statuses, upload or
  replace a validated private PDF up to 10 MiB, review it through a 60-second
  signed URL, and confirm permanent PDF removal while retaining the agreement
  record. New `mou_documents` metadata, a private `mou-documents` bucket,
  matched-Vendor read policies, Admin write policies, audit triggers, and
  covering indexes enforce the workflow in Supabase.
- Added an Admin manual-meeting workflow that selects one delegation Vendor
  and one Malaysian partner, records the Admin's Zoom or Lark preference,
  creates or reuses their tenant-scoped match, validates the future time,
  duration, interpreter, and agenda, and publishes the scheduled session to
  both Vendor calendars without bypassing mutual acceptance for the protected
  provider link. Calendar entries and meeting-list rows now open a responsive
  details dialog where Admins can safely amend the schedule, provider
  preference, interpreter, and agenda; Vendor pairing and protected provider
  links remain immutable, provider-backed schedules stay locked, and a copy
  action shares only the protected Plexus join URL once it is ready. Compact
  selector values now prevent long industry labels from overlapping adjacent
  fields.
- Replaced free-text sector fields across Admin/Superadmin Vendor provisioning,
  operational company create/edit, and the Vendor registration profile with a
  searchable global industry picker covering every section and division in UN
  ISIC Revision 5; existing custom values remain visible until deliberately
  replaced, and company directories now resolve legacy pending labels from the
  Vendor's submitted sector.
- Replaced the Vendor match-card fallback with the real tenant-scoped
  counterpart name and sector from the limited candidate directory; each card
  now shows the explicit company-to-Vendor relationship, both decisions, a
  details dialog, and state-aware meeting navigation without exposing private
  counterpart profile or contact fields.
- Added a locale-preserving **Back to My matches** action to the Vendor
  discovery header, with a full-width mobile treatment and verified return to
  the Vendor's own match list.
- Made Vendor dashboard profile, match, meeting, and MOU metrics live through
  tenant-scoped Supabase Realtime subscriptions, with focus/visibility and
  periodic refresh recovery when a realtime connection is interrupted.
- Added live validated answered/total counters beside every collapsible Vendor
  registration-profile section, including conditional-answer and supporting
  document progress.
- Added a searchable international calling-code picker covering every
  supported country and region to the Vendor contact profile, while preserving
  the existing single international phone value for validation and storage.
- Kept the white-label Vendor workspace sidebar and responsive mobile
  navigation visible on company discovery, highlighted My matches during
  discovery, and made every sidebar destination return to the corresponding
  Vendor workspace section.
- Replaced the Vendor profile's placeholder PDF control with a private,
  tenant/company-scoped document library that validates PDF signatures and a
  6 MiB limit, supports short-lived review links and confirmed deletion, and is
  enforced by dedicated Supabase metadata and Storage RLS policies.
- Simplified the Vendor registration profile to the signed-in company, added a
  live validated completion score and independently collapsible sections, and
  enforced client/server formats for year, URL, email, phone, introduction, and
  consent date before tenant-scoped Supabase persistence.
- Replaced Plexus branding in tenant portal navigation with the Admin tenant's
  saved white-label name and logo, changed Vendor dashboard metrics to
  company-scoped profile, pending-match, upcoming-meeting, and active-MOU
  indicators, and removed the internal persistence/Auth/RLS notice.
- Kept the responsive Admin sidebar visible on the dedicated Vendor accounts
  route, highlighted the active destination, and linked every operational
  sidebar item back to its corresponding Admin dashboard section; enlarged the
  phone drawer, navigation text, icons, account control, and touch targets for
  comfortable mobile use.
- Expanded the Vendor editor with company size, subtype-specific profile,
  business contact, account-holder, and login-email controls; synchronized
  login changes across the tenant-scoped profile and server-only Auth account,
  with validation and rollback when either side rejects the update.
- Expanded the canonical testing strategy into a full production test plan
  covering every implemented product route, Server Action, protected API,
  domain boundary, and business data group across the Superadmin, Admin,
  Delegation Vendor, and Partner Vendor layers, with three-layer UI/server/data
  expectations, production fixtures, evidence, stop conditions, cleanup, and
  release sign-off.
- Automated provider meeting creation when the second Vendor accepts, added a
  unique service-only creation job to prevent duplicate provider calls, and
  surfaced sanitized creation failures as critical Superadmin incidents with
  audited, capped retry while preserving the Vendors' agreement.
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
