# Changelog

Every meaningful code, database, configuration, deployment, or documentation
change must be recorded here with its date. The change and changelog entry are
reviewed together.

## Unreleased

### 2026-08-28

- Tightened the homepage's mobile online-to-on-ground handoff, restarted the
  highlighted capability card sequence at 01, and corrected the Deals &
  documents card mapping and Mixed readiness label. Replaced the handoff's
  button-like arrow with a cleaner directional transfer signal and centered its
  travel corridor across mobile and desktop layouts. Removed the decorative
  horizontal connector behind the four event phases. Removed Simplified Chinese
  from the English investment eyebrow, aligned its section typography with the
  shared role-page scale, and corrected Event operations readiness to Mixed.
- Made the TChina registration WhatsApp contact number default to the entered
  international mobile number, while retaining any manually entered alternative;
  placed country before mobile, added Email as a preferred contact method, and
  label the identifier by the selected method. Business-matching interest now
  explains that organizer follow-up may use the supplied email without sending
  automated messages.
  Aligned Malay and Simplified Chinese readiness-badge colors with English.

### 2026-08-27

- Reframed the English public-site copy around the program-operator outcome:
  cross-border introductions that become meetings and accountable next actions.
  The homepage now uses clearer human-reviewed journey, event, capability, and
  audience language, adds a final program CTA, and aligns key page headlines,
  footer positioning, and default metadata with that promise. The English
  Pre-event Service page now leads with visit preparation, clearer availability
  boundaries, and one consistent inquiry action.
- Replaced the public Traditional Chinese locale with Simplified Chinese
  (`zh-Hans`), while retaining the protected portal's existing `zh` and
  `zh-Hant` routes. Copy-edited the public Bahasa Malaysia and Simplified
  Chinese dictionaries and inline public-page text for grammar, terminology,
  punctuation, and source fidelity; legacy public Chinese aliases now resolve
  to `zh-Hans`, and `zh-Hans` public auth aliases continue into the protected
  portal's canonical `zh` route.
- Added localized Pricing and Contact enquiry forms that submit directly to the
  configured Plexus mailbox through Resend without storing personal data. Both
  pages also offer WhatsApp as a distinct enquiry path, Pricing preselects its
  scoped proposal topic, and invalid, unavailable, and failed-delivery states
  retain the visitor's input with an email fallback. The documented WhatsApp
  number is a temporary placeholder to replace before production launch.
- Made Command Center CI validation ignore volatile Git branch, commit, and
  working-tree fields while continuing to validate the generated inventory.
- Localized the public Product preview, including its metadata, navigation,
  accessible image text, readiness map, and public return links, across
  English, Bahasa Malaysia, and Traditional Chinese. Public login and password
  recovery aliases now retain the selected locale, Malay sign-in and recovery
  copy is available, and localized 404 recovery links return visitors to the
  matching public homepage.
- Standardized Simplified Chinese display headlines across the public pages and
  Product preview: clause commas now become intentional line breaks and terminal
  full stops are removed. Refined the homepage online-to-on-ground handoff into
  a clearer send, relay, and receive sequence with reduced-motion support.

### 2026-08-26

- Removed the inert contact-field preview from the TChina registration Path
  step, leaving contact data entry exclusively in the following details step.
- Replaced the TChina registration phone field with a Malaysia-defaulted,
  flag-labelled country calling-code selector and a separate local-number entry
  while retaining the normalized international-number submission contract; its
  245 flags are local, attributed SVG assets rather than third-party requests.
- Added searchable country pickers to the TChina registration calling-code and
  Country / region fields in English and Simplified Chinese.
- Opened the production TChina Expo questionnaire in English and Simplified
  Chinese with visibly labelled sample venue, organizer, address, and support
  details for controlled live testing; official event details remain pending.
- Recast the homepage capability showcase as a warm editorial bento inspired
  by the supplied reference, using real Plexus product previews, mixed card
  proportions, explicit readiness labels, and one brand-blue PLEXA route to
  the maintained 12-module map.
- Animated the homepage's online-to-on-ground connector as an in-view handoff
  signal with a responsive destination state, offscreen pausing, and a static
  reduced-motion fallback.
- Expanded the localized public About page with Plexus's evidence-bound vision,
  mission, human-governed operating principles, protected-scope commitment,
  Asia starting focus, and candid product promise.
- Rewrote the localized public pricing page around three scoped engagement
  models and explicit proposal inputs, replacing MVP and package shorthand
  without inventing rates or confirmed commercial terms.
- Added four original, clearly illustrative editorial images to the public
  event cards, with responsive Next.js image delivery, stable crops, accessible
  linked previews, and recoverable generation prompts.
- Reworked the homepage event layer as one continuous online-to-on-ground
  lifecycle rail, and replaced oversized capability icons with selected,
  clearly labelled Plexus product-preview imagery.
- Added an Apple-inspired homepage capability showcase with eight highlighted
  product modules, explicit Live/Mixed/Adapter/Concept readiness, and a direct
  route to the maintained 12-module product map in all public locales.
- Added a redesigned homepage events layer that carries pre-event preparation,
  on-site matchmaking, delegation coordination, and accountable follow-up into
  one responsive governed-record composition across all three public locales.
- Added a development-only TChina questionnaire route at
  `/[locale]/tchina-expo/preview` for interactive local review. It uses clearly
  marked placeholder event details, simulates completion without saving data,
  and remains unavailable in production.
- Refined the TChina questionnaire briefing into a capped 300–380px rail from
  intermediate widths upward, with clearer event metadata, tighter mobile
  grouping, and zero horizontal overflow so the active form remains the visual
  priority.
- Added Investment promotion and Government & bilateral as first-class public
  audiences, plus localized `/events` and seed-driven `/events/[slug]` routes
  backed by four explicitly illustrative pre-launch
  event records. The homepage, shared navigation, footer, workflow, business,
  pricing, and about copy now expose the four-audience information architecture;
  `/for-investment` also renders three localized illustrative project examples.
  All new public copy is available in English, Bahasa Malaysia, and Traditional
  Chinese without changing the existing visual system or claiming confirmed
  programs, incentives, partners, or outcomes.
- Added the TChina Expo 2026 registration slice: one noindex public
  questionnaire at `/[locale]/tchina-expo` for English and Simplified Chinese,
  distinct Business Delegate and General Visitor paths, step validation,
  review/edit, and a pending-not-confirmed receipt. Added the strict 64 KiB
  server-bound submission API, honeypot and duplicate privacy, a Plexus-owned
  singleton/event-registration schema with RLS and immutable-answer safeguards,
  and a Superadmin console tab for exact event setup, publication, public-link
  copy, search/detail, rejection, and confirmed deletion. The hosted migration
  is applied with registration closed; normal Admins and tenants have no TChina
  navigation or database access. A follow-up migration adds covering indexes for
  future linked Delegate/Auth records. Approval and all invitation/setup email
  actions remain deliberately unavailable while email provisioning is deferred.

- Hardened the shared platform and tenant sign-in experience across English,
  Simplified Chinese, Traditional Chinese, and Thai. The misleading inactive
  “Remember me” control is removed; Server Actions now return stable safe error
  codes instead of authorization-binding detail; visible and assistive recovery
  copy is localized; unavailable tenant links receive a privacy-safe notice;
  support always has an actionable destination; password-reset confirmation is
  inline and one-time; browser autofill preserves the bright credential
  surface; and the compact mobile layout raises secondary controls to the 44px
  accessibility target floor.
- Redesigned the shared platform and tenant login as the user-approved
  Governed Checkpoint: a fixed Midnight Plexus or tenant identity rail now
  opens into a bright three-stage canvas for Identity, Workspace, and
  Responsible next step. The credential form occupies the active Identity lane
  without a floating card, support remains explicit, tenant branding and auth
  behavior are unchanged, and mobile preserves the sequence as a task-first
  stack without horizontal overflow. The identity rail now uses the supplied
  full-bleed network image with a restrained opacity-only twinkle that becomes
  static for reduced-motion preferences.
- Upgraded the global Vercel CLI from `59.3.0` to `59.5.0`, moved Next.js and
  its aligned ESLint config to `16.3.3`, updated the `shadcn` toolchain, and
  refreshed transitive dependencies. Both the full and production-only npm
  audits now report zero vulnerabilities; the type-only vulnerable
  `@vercel/config` dependency was removed without changing the `vercel.ts`
  deployment contract.
- Fixed Vendor Realtime subscriptions that could reach Postgres with the
  anonymous JWT and emit `P0001 invalid column for filter match_id`. The client
  now resolves the authenticated session and explicitly authorizes Realtime
  before registering tenant-scoped Postgres Changes filters, with periodic and
  focus-based refresh remaining as the recovery path.
- Clarified the product actor model across the vision, role guide,
  architecture, glossary, and Development Command Center. The current
  technical `vendor` authorization role now maps explicitly to **Business
  Participant**, **Admin / Organizer** coordinates those participants and
  **Local Service Partners**, and service partners remain Admin-managed
  operational relationships until assignment-scoped login permissions are
  deliberately designed and verified.
- Consolidated navigation into two maintained systems: one shared public
  header now serves the homepage, product preview, pre-event, marketing, and
  both legal route families, while one configurable workspace navigation shell
  now serves Admin, Vendor/business, and Superadmin desktop and mobile views.
- Added the Plexus Development Command Center to `docs/development/` as the
  required visual review entry point for every meaningful change. It now
  inventories the whole visible worktree, all 90 Markdown files, all 56 page
  routes and 19 Route Handlers, and evidence-backed system health alongside the
  canonical product, architecture, delivery, and production-readiness view.
  `npm run docs:command-center` regenerates file and route data, documentation
  checks reject stale inventory, and the route contract now covers the five
  previously omitted resource and compliance handlers. The database inventory,
  project status, and roadmap now reflect 46 committed migrations, 28
  RLS-enabled public tables in source, the current READY Vercel production
  deployment, the verified Git link, and the remaining live Supabase and
  browser-evidence gaps. The README, deployment guide, and production test
  catalog now describe the current two-party meeting-time approval flow, shared
  blue pre-event navigation, and verified Git deployment posture instead of
  superseded automatic-meeting and blocked-integration behavior.
  Root contributor guidance now uses the command-center refresh plus the
  combined release/browser health command as the standard handoff sequence.
  Health evidence records the local RLS suite as unavailable because its
  repository CLI cannot connect to an active local PostgreSQL stack.
- Replaced the homepage's generic pre-event hero photograph with a purpose-built
  governed-collaboration scene. The new localized visual keeps the program
  operator, business owner, shared laptop, human-review status and four-stage
  Plexus workflow legible inside the responsive hero crop without changing the
  dedicated pre-event campaign asset.
- Replaced the homepage's disconnected journey cards with one governed
  operating itinerary. Each handoff now names its decision owner and recorded
  outcome, the abstract slogan row is removed, and one integrated governance
  strip keeps human review explicit across desktop and localized mobile views.
- Rebuilt the five selected `/app` product visuals for their actual responsive
  slots: a clearer three-device superapp hero, front-facing Plexus Talk and
  Deal Radar screens, country-context PLEXA draft assistance in Agreement
  Studio, and a governed non-humanoid PLEXA coordination core.
- Added a ten-question multilingual FAQ to `/contact`, covering audience fit,
  pre-launch availability, operator scope, human-reviewed matching, participant
  entry, languages, consultation pricing, scoped data access, meeting follow-up,
  and the appropriate next inquiry route.
- Aligned the homepage principle cards to one shared top and bottom edge by
  removing the translated middle-card offset while preserving responsive
  stacking and equal-height behavior for localized copy.
- Tightened the shared public header into a 68px, centered navigation rail with
  a smaller wordmark, compact one-line routes, a click-to-open locale selector,
  and an explicit pre-event utility action. The full route row now collapses
  before labels can wrap, with complete tablet and mobile navigation retained.
- Rebuilt `/app` as a clean blue superapp product preview. A unified mobile and
  desktop product ecosystem now leads the page, the end-to-end company journey
  is visible from profile through accountable follow-up, all twelve product
  domains are findable in one readiness-labelled map, and live, mixed,
  adapter, and concept capabilities remain explicitly distinguished across
  desktop and mobile.
- Consolidated the pre-event header's always-visible EN, BM, and Traditional
  Chinese controls into one accessible language selector. The active locale
  remains visible and the three localized routes are progressively disclosed
  on click across desktop and mobile.

### 2026-08-25

- Brought `/pre-event` into the shared Plexus blue editorial system. Midnight,
  Filled Surface Blue, Connection Blue, cyan signals, pale network surfaces,
  and cool hairlines now replace the route's former emerald/lime campaign
  palette while preserving its compact campaign geometry, multilingual
  content, country explorer, contact behavior, and responsive layout.
- Rebuilt the public Plexus experience around the approved blue editorial
  direction. The homepage now identifies Plexus as a pre-launch application,
  preserves the exact wordmark and public locales, explains the governed
  five-stage business journey, and routes visitors clearly to the product
  preview, special pre-event service, or role-based login.
- Reframed `/app` as an illustrative pre-launch product preview, removing
  production-ready language from concept capabilities and connecting the route
  to the shared public navigation. The `/pre-event` campaign keeps a scoped,
  compact service-page treatment with a clearer special-service label and
  upgraded responsive hero treatment.
- Reworked the Admin, Vendor, and Superadmin visual foundation with a midnight
  navigation rail, Connection Blue actions, mineral operating canvas,
  editorial metric blocks, a human-governed Admin program pulse, responsive
  2×2 mobile metrics, and a light default theme while retaining the optional
  dark treatment and all existing role, tenant, and workflow behavior.
- Added route-arrival and hero motion with reduced-motion fallbacks, themed
  browser focus/selection/scroll surfaces, hash-safe public locale links, route
  coverage for localized fragment navigation, and refreshed desktop/mobile
  visual evidence under `.impeccable/review/`.
- Closed the independent finish review by deepening filled blue surfaces for
  readable contrast, exposing mobile pre-event language controls, setting the
  document language from the active public or protected locale, keeping the
  English-only product preview from advertising unsupported translations, and
  replacing hard-coded public contact details with approved environment-backed
  channels. Public operator language now uses **Program Operator** with
  `/for-program-operators` as the canonical route and `/for-vendors` retained
  as a compatibility redirect.
- Restored Admin task hierarchy with an organizer-review attention queue and
  primary actions before the session list, reframed speculative product-preview
  capabilities at every point of use, and aligned authentication with the blue
  governed-workspace direction. Production-mode desktop and mobile evidence
  now covers public, Admin, participating-company, Superadmin, and login views
  using clearly labelled neutral demo data.

### 2026-08-24

- Added editable SVG and 4× transparent PNG versions of the Plexus wordmark,
  preserving the white lettering and layered blue-gradient ribbon treatment
  of the existing brand asset.
- Added the project-scoped Impeccable design skill for Codex, including its
  UI-change and end-of-task design review hooks, and excluded vendored agent
  skill content from Plexus's application lint and product-documentation
  checks.
- Added Impeccable's durable product context, recording Plexus's primary
  audiences, product purpose, positioning, operating constraints, evidence,
  production-honesty boundaries, accessibility commitments, and confirmed
  comp-first workflow default for new surfaces.
- Documented the incumbent Plexus visual system as **The Trusted Exchange** in
  the portable `DESIGN.md` format, with machine-readable tokens, layered
  operational/public/campaign guidance, and an Impeccable sidecar containing
  tonal ramps, depth, motion, breakpoints, and self-contained component
  previews; the documentation checker now recognizes standards-compliant YAML
  frontmatter before a Markdown H1.

### 2026-08-23

- Removed the boxed background from the public footer logo by using the
  transparent, tightly cropped Plexus wordmark while preserving tenant-specific
  branding behavior.
- Refined the `/pre-event` campaign content using the supplied business-matching
  brief. The multilingual page now leads from business objectives and target
  connections to relevant introductions, confirmed meetings, visit details,
  and next actions, while retaining WhatsApp-only contact, market-by-market
  availability checks, and explicit non-booking and non-guarantee boundaries.

### 2026-08-22

- Added the multilingual `/pre-event` promotion page for international
  delegates. It explains profile preparation, curated business matching,
  confirmed meetings, arrival planning, and controlled concierge handoffs for
  flights, hotels, travel documents, transfers, interpreters, liaison, and site
  visits. A searchable 240+ country directory prepares a localized WhatsApp
  draft to the existing Plexus number without submitting or storing visitor
  data. Worldwide inquiries remain distinct from the Malaysia and Macao live
  focus; direct booking, payment, visa approval, unapproved MDEC co-branding,
  and unverified fallback channels are explicitly excluded.
- Redesigned `/pre-event` around the approved emerald, warm-white, lime, and
  navy campaign direction. The route now uses the transparent Plexus wordmark,
  a purpose-built image of a delegate and coordinator preparing profiles,
  matches, meetings, and arrival logistics, a navy Login action, and a cleaner
  editorial country-search experience without changing contact or market
  availability behavior.

### 2026-07-30

- Added a Superadmin-only **Email sending** control center with cross-tenant
  provider readiness, delivery metrics, sender-grouped activity, searchable
  recipient status, and a complete action-coverage register. Business,
  broadcast, application, account-security, match, meeting, MOU, itinerary,
  attendance, and resource messages now use tracked Resend delivery; secure
  recovery/setup links remain owned by Supabase Auth and are labelled
  `requested`. Signed Resend webhooks update lifecycle states, and an
  authenticated hourly Vercel cron sends duplicate-protected application,
  meeting, and incomplete-MOU reminders. The recipient ledger and provider
  events are service-written and readable only by an active Superadmin.
  Business email fails closed when tracking is unavailable, information-blast
  drafts do not send, and the approved branded From address is
  `Plexus <notifications@info.plexus.enterprises>`.
- Changed mutually accepted Vendor matches to a **Pending meeting** state until
  both Vendors approve the exact future time. The first Vendor selects one
  Admin-open date and one 1-hour time, creating only a tenant-scoped proposal
  with its own approval. The counterpart must review and approve that proposal
  before the database atomically creates the meeting. Admin Meeting settings
  publish recurring availability, and the slot is revalidated at proposal and
  approval time. Legacy future placeholders are returned to neutral proposals
  requiring both approvals. Only then does **View meeting** open **My
  Meetings**; a one-sided meeting proposal never appears as scheduled.
- Moved Logout out of the account-settings dialog and into a persistent action
  at the bottom of the desktop sidebar and mobile navigation drawer. Removed
  the redundant **Open [role] page** action from account settings.
- Replaced the empty Delegation dashboard itinerary card with the Vendor's
  permitted Admin-shared resources. Only `all` or `delegation` resources with
  Delegation visibility appear, each with its existing authorized open action;
  the complete itinerary remains available in **On-site**.
- Made one-sided Vendor acceptance reversible until the other Vendor accepts
  or a meeting is arranged. The match card now shows **Accepted by you** with
  an active **Unaccept** control, while the database trigger still blocks
  cross-party decisions, direct rejection, acceptance rewrites, and any
  withdrawal after the mutual-acceptance boundary.
- Added two-party Vendor MOU acceptance. Completing a meeting now atomically
  creates its one pending MOU, each participating Vendor must explicitly tick
  an authorization agreement before signing, the first signature waits for
  the counterpart, and the second produces a verified `Signed` MOU. Signature
  actor/time evidence, tenant and match validation, Admin impersonation denial,
  cross-tenant denial, RLS coverage, and the Vendor signing states are included.
- Added a guided Vendor meeting empty state. Vendors with no scheduled
  meetings are told that an accepted match is required before requesting a
  meeting and can return directly to **My Matches** from the empty schedule;
  same-route navigation now also selects the route-requested Vendor tab.
- Fixed Vendor match acceptance for legacy `Rejected` rows and made each
  decision actor-owned. **Request change** is removed, the match cards show
  the true two-party progress, and the second acceptance unlocks meeting
  arrangement or the protected meeting link. The database trigger rejects
  Vendor-side rejection and cross-party decisions while preserving Admin
  reset authority.
- Added an owning-Admin Vendor discovery control to Matching. Disabling the
  tenant capability hides **Find companies**, changes the empty Vendor match
  guidance, redirects direct discovery routes, returns no candidate rows, and
  blocks Vendor-created match requests while preserving Admin-managed
  matching and limited counterpart summaries for existing matches. The setting
  is tenant-scoped, audited through the existing tenant update trigger, and
  covered by authorization, RLS, route, and browser tests.
- Removed the static Admin phase timeline so the live operating picture uses
  the full dashboard width. Meeting actions now sit in a consistent labeled
  panel with the join action first, completed/cancelled meetings no longer
  offer completion again, and active meetings require an explicit confirmation
  dialog before they are marked completed and locked for editing.

### 2026-07-29

- Removed meeting format, available dates, and maximum-meeting questions from
  the public Vendor application at the client PIC's request. Public application
  validation and completion now cover 25 intake items, while the signed-in
  Vendor profile retains meeting preferences for later planning.
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
- Removed the tenant login link from the submitted Vendor application
  confirmation so applicants remain on the awaiting-review message until an
  Admin approves the application and sends the password-setup email.
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
