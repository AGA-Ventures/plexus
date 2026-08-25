**Mutual Vendor Meeting Approval Verification — 2026-07-30**

**Source Visual Truth**

- Browser Comment 1 capture of the authenticated English Partner Vendor match
  card showing a meeting as scheduled immediately after one Vendor chose it.
- Source capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-meeting-source.jpg`.
- The requested outcome was to preserve the existing match-card design while
  introducing a clear two-Vendor approval boundary before a meeting exists.

**Implementation Evidence**

- Route: `http://localhost:3000/en/vendor?section=matches`.
- Implementation capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-meeting-mutual-approval-implementation.jpg`.
- Combined source/implementation comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-meeting-mutual-approval-comparison.jpg`.
- Source and implementation captures are both 1280 x 720 pixels at CSS density
  1 in the same authenticated in-app browser, tenant, locale, and match flow.
- State: the migrated one-sided future placeholder is now a neutral proposal;
  the approval dialog is open and shows the exact time plus both Vendor
  approval states.

**Findings**

- No actionable P0, P1, or P2 visual, responsive, accessibility, or
  interaction issue remains. The approval dialog is an intentional new state
  required to prevent a one-sided proposal from appearing as a meeting.

**Required Fidelity Surfaces**

- Fonts and typography: passed; existing title, description, badge, data-label,
  and action typography is preserved.
- Spacing and layout rhythm: passed; the compact approval summary fits the
  existing dialog width without clipping or overflow.
- Colors and visual tokens: passed; pending approvals use existing outline
  badges and the confirm action uses the tenant primary treatment.
- Image quality and asset fidelity: passed; no raster asset changed and the
  approval action reuses the existing icon library.
- Copy and content: passed; the dialog states that both Vendors must approve,
  shows the exact date/time and interpreter preference, and labels each
  company's approval separately.
- Interaction and accessibility: passed; the trigger and confirmation are
  semantic buttons, the dialog is labelled, Cancel closes without mutation,
  and approval does not happen during visual verification.

**Primary Interactions Tested**

- A one-sided migrated placeholder no longer appears in My Meetings or as
  **Meeting scheduled** on the match card.
- The match card shows **Meeting approval needed** and the proposed time.
- **Review & approve** opens the labelled confirmation dialog with both
  approval states.
- RLS tests verify that the first approval creates no meeting, the proposing
  Vendor cannot approve for the counterpart, and the counterpart's approval
  atomically creates exactly one meeting.
- Browser console and server rendering remained free of new errors during the
  inspected state. The final approval was not clicked against live data.

**Comparison History**

- Iteration 1 separated the pending proposal from `meetings` and added a
  confirmation dialog. The initial legacy copy exposed an implementation term
  ("migrated"); it was replaced with plain two-Vendor approval guidance.
- The post-fix combined comparison preserves the existing card hierarchy and
  adds the requested approval evidence with no remaining P0/P1/P2 difference.

**Final Result**

- final result: passed

---

## Plexus Blue Editorial Redesign Verification — 2026-08-25

**Approved Visual Direction**

- Public desktop: `.impeccable/mocks/editorial-level/website-desktop.webp`.
- Public mobile: `.impeccable/mocks/editorial-level/website-mobile.webp`.
- Admin desktop: `.impeccable/mocks/editorial-level/admin-desktop.webp`.
- Admin mobile: `.impeccable/mocks/editorial-level/admin-mobile.webp`.

**Production Evidence**

- Public: `.impeccable/review/public-desktop-final.png` and
  `.impeccable/review/public-mobile-final.png`.
- Admin: `.impeccable/review/admin-desktop-final.png` and
  `.impeccable/review/admin-mobile-final.png`.
- Participating company: `.impeccable/review/vendor-desktop-final.png` and
  `.impeccable/review/vendor-mobile-final.png`.
- Superadmin: `.impeccable/review/superadmin-desktop-final.png` and
  `.impeccable/review/superadmin-mobile-final.png`.
- Authentication: `.impeccable/review/login-desktop-final.png` and
  `.impeccable/review/login-mobile-final.png`.
- Product preview: `.impeccable/review/app-preview-desktop-final.png` and
  `.impeccable/review/app-preview-mobile-final.png`.
- Pre-event campaign: `.impeccable/review/pre-event-desktop-final.png` and
  `.impeccable/review/pre-event-mobile-final.png`.

**Viewport And Coverage**

- Desktop viewport: 1536 x 1024 CSS pixels.
- Mobile viewport: 430 x 932 CSS pixels.
- Routes and states: public homepage, product preview, pre-event campaign,
  Admin workspace, participating-company workspace, Superadmin console, and
  tenant login.
- Exact Plexus logo and multilingual navigation were preserved.
- Horizontal overflow: none across the verified desktop and mobile states.
- Public contact fallback, legacy participating-company redirect, mobile
  navigation, and language behavior were exercised.
- Filled action blue and its light foregrounds meet the intended contrast
  threshold.

**Release Verification**

- Impeccable finish review disposition: `ship`.
- Thesis, own-world, story, first viewport, and form checks: passed.
- `npm run docs:check`: passed.
- Lint and TypeScript checks: passed.
- Unit/integration suite: 36 test files and 204 tests passed.
- Next.js production build: passed, with 51 routes and no temporary review
  routes.

**Final Result**

- final result: passed

---

## Pre-event Blue Theme Verification — 2026-08-25

**Direction Change**

- Replaced the route-local emerald and lime palette with the shared Plexus
  blue editorial system.
- Midnight owns the hero, contact region, and header; Filled Surface Blue owns
  small-text actions; Signal Cyan carries campaign orientation; mineral and
  pale-network surfaces structure the service and country content.
- The compact 4px campaign geometry, exact wordmark, copy, multilingual
  navigation, and contact behavior remain unchanged.

**Visual Evidence**

- Prior desktop reference: `.impeccable/review/pre-event-desktop-final.png`.
- Blue desktop hero: `.impeccable/review/pre-event-blue-desktop-top.jpg`.
- Blue desktop country explorer:
  `.impeccable/review/pre-event-blue-desktop-country.jpg`.
- Blue mobile hero: `.impeccable/review/pre-event-blue-mobile-top.jpg`.
- Blue mobile country explorer:
  `.impeccable/review/pre-event-blue-mobile-country.jpg`.
- Blue mobile selected-country state:
  `.impeccable/review/pre-event-blue-mobile-selected.jpg`.

**Viewport And Interaction Coverage**

- Desktop viewport: 1536 x 1024 CSS pixels.
- Mobile viewport: 430 x 932 CSS pixels.
- Verified the hero, navigation, responsive calls-to-action, journey and
  service sections, market status list, country explorer, contact region, and
  footer.
- Selected Afghanistan in the country explorer; `aria-pressed`, the visible
  selected treatment, and the departure-country summary all updated.

**Contrast Evidence**

- White on Filled Surface Blue: 6.48:1.
- Signal Cyan on Midnight: 13.19:1.
- Filled Surface Blue on Mineral Paper: 6.03:1.
- Muted Ink on Mineral Paper: 5.49:1.
- Search placeholder on the cool input surface: 4.79:1.

**Verification**

- Pre-event and public-site unit tests: 7 passed.
- Full unit suite: 36 test files and 204 tests passed.
- TypeScript check: passed.
- Lint and Next.js production build: passed.
- Documentation check: passed for 48 Markdown files.
- Git whitespace check: passed.

**Final Result**

- final result: passed

---

## Pre-event Language Selector Verification — 2026-08-26

**Requested Simplification**

- Replaced the always-visible `EN`, `BM`, and `繁體中文` desktop row with one
  compact language disclosure control.
- The control shows only the active locale until clicked, then reveals English,
  Bahasa Malaysia, and Traditional Chinese as full-width menu choices.
- The same interaction and route order are used on desktop and mobile.

**Visual Evidence**

- Source with exposed locale row:
  `.impeccable/review/pre-event-blue-desktop-top.jpg`.
- Desktop selector closed:
  `.impeccable/review/pre-event-language-desktop-closed.jpg`.
- Desktop selector open:
  `.impeccable/review/pre-event-language-desktop-open.jpg`.
- Mobile selector open:
  `.impeccable/review/pre-event-language-mobile-open.jpg`.

**Viewport And Interaction Coverage**

- Comment-matched desktop viewport: 1327 x 964 CSS pixels.
- Mobile viewport: 430 x 932 CSS pixels.
- Opened the selector from English and confirmed that all three choices were
  hidden before activation and visible afterward.
- Selected Bahasa Malaysia and confirmed navigation to
  `/pre-event?lang=ms`, the localized control label, and active `BM` state.
- Reopened the English selector on mobile and confirmed the same three choices
  remain visible and usable without horizontal clipping.

**Verification**

- Pre-event and public-site unit tests: 7 passed.
- Full unit suite: 36 test files and 204 tests passed.
- TypeScript check: passed.
- Lint and Next.js production build: passed.
- Documentation check: passed for 48 Markdown files.
- Git whitespace check: passed.

**Final Result**

- final result: passed

---

**Pre-event Promotion Page Verification — 2026-08-22**

**Source Visual Truth**

- Selected promotion-page direction:
  `/Users/chishiongtan/.codex/generated_images/01a027d3-b951-70f0-abdd-2d62ed1bdc5f/exec-cd56ccf8-47c9-4be9-9b34-1cc3ee842973.png`.
- Source pixels: 951 x 1654.

**Implementation Evidence**

- Route: `http://localhost:3101/pre-event?lang=en`.
- Desktop production capture:
  `/tmp/plexus-pre-event-production-desktop-top.jpg`.
- Mobile production capture:
  `/tmp/plexus-pre-event-production-mobile-top.jpg`.
- Country-directory focused capture:
  `/tmp/plexus-pre-event-production-country-directory.jpg`.
- Final hero side-by-side comparison:
  `/tmp/plexus-pre-event-hero-comparison-final-v3.png`.

**Viewport And Normalization**

- Desktop implementation: 1440 x 1024 pixels at a 1440 x 1024 CSS viewport.
- Mobile implementation: 412 x 915 pixels at a 412 x 915 CSS viewport.
- The source's top 951 x 676 region and the 1440 x 1024 implementation capture
  were normalized to 720 x 512 each and placed together in one 1440 x 512
  comparison image.
- State: unauthenticated, English locale, top-of-page campaign state; the
  country-directory capture uses its default worldwide-list state.
- Horizontal overflow: none at 1440px or 412px.

**Full-view Comparison Evidence**

- The implementation matches the selected direction's deep forest-green hero,
  warm-white content canvas, lime conversion controls, navy Login button,
  centered headline, transparent Plexus wordmark, and wide editorial image
  treatment.
- The implementation continues below the source concept with the required
  worldwide directory, contact configuration, footer navigation, and
  coordinator disclaimer without changing the approved visual language.

**Focused Region Comparison Evidence**

- The hero comparison keeps the logo, navigation, headline wrapping, CTA
  hierarchy, image crop, and background tone legible in the same image.
- The dedicated directory capture verifies the two-column layout, search
  control, 245-country list, prepared inquiry state, and readable WhatsApp CTA
  at full desktop size.
- The mobile capture verifies headline wrapping, logo treatment, stacked CTAs,
  hero-image crop, touch-target sizing, and absence of horizontal overflow.

**Required Fidelity Surfaces**

- Fonts and typography: passed; the existing public-site sans serif is used
  with the source's centered, bold display hierarchy and restrained supporting
  copy.
- Spacing and layout rhythm: passed; the hero frame was widened to 1440px with
  32px desktop gutters, while the content sections retain a calm 1280px reading
  measure and collapse cleanly on mobile.
- Colors and visual tokens: passed; the hero and closing CTA use sampled deep
  forest green (`#0b2924`), conversion controls use lime, and Login uses the
  requested navy (`#0b1f3a`).
- Image quality and asset fidelity: passed; the 1672 x 941 generated hero asset
  clearly depicts a Plexus coordinator reviewing a business profile, curated
  matches, confirmed meetings, and a travel itinerary. The supplied Plexus
  wordmark was trimmed to its transparent bounds rather than recreated.
- Copy and content: passed; the three public languages preserve the approved
  pre-event matching, travel coordination, worldwide-inquiry, and no-direct-
  booking/no-payment claims.

**Primary Interactions Tested**

- English, Bahasa Malaysia, Traditional Chinese, and unsupported-locale
  normalization render the expected localized heading, title, and canonical.
- Country search filters to Macao SAR China, selection updates `aria-pressed`,
  and the WhatsApp draft contains the selected country and correct
  `+60 12-267 7899` destination.
- MDEC co-branding, email, callback, WeChat, and LINE remain hidden while
  unconfigured.
- Footer Pre-event Support points to `/pre-event?lang=en`.
- Production browser console errors and warnings: none.

**Comparison History**

- Iteration 1 identified a P2 fidelity mismatch: the implementation's emerald
  background was visibly lighter than the source, the campaign frame used
  narrow max-width gutters, and the untrimmed transparent logo appeared too
  small.
- Fix: sampled the source tone into `#0b2924`, widened the campaign header and
  hero image to 1440px with 32px gutters, and created a route-specific trimmed
  transparent wordmark asset.
- Iteration 2 used
  `/tmp/plexus-pre-event-hero-comparison-final-v3.png`; the palette, logo scale,
  image width, headline hierarchy, and navy login treatment align with the
  source, with no actionable P0/P1/P2 difference remaining.

**Findings**

- No actionable P0/P1/P2 visual, responsive, accessibility, or interaction
  issue remains.

**Follow-up Polish**

- P3: the small campaign eyebrow is retained from the approved multilingual
  content even though it is not present in the visual source.

**Final Result**

- final result: passed

---

**Tenant Meeting Availability And Date-First Booking Verification — 2026-07-30**

**Source Visual Truth**

- Browser Comment 1 capture of the authenticated English Partner Vendor
  **Schedule meeting** dialog.
- Source capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-schedule-dialog-implementation.jpg`.
- The source displayed 20 mixed date/time checkboxes and required three
  selections. The requested outcome was an explicit date-first flow that shows
  only the times opened by the owning Admin.

**Implementation Evidence**

- Route: `http://localhost:3000/en/vendor?section=matches`.
- Implementation capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-meeting-slot-picker-implementation.jpg`.
- Combined source/implementation comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-meeting-slot-picker-comparison.jpg`.
- Source and implementation captures are both 1280 x 720 pixels at CSS density
  1 from the same authenticated in-app browser, tenant, locale, and match.
- State: dialog open, July 31 selected, and 10:00–11:00 selected in the
  implementation. The source showed the corresponding unselected dense list.

**Findings**

- No actionable P0, P1, or P2 visual, responsive, accessibility, or
  interaction issue remains. The reduced dialog height and changed controls
  are intentional results of the requested two-step flow.

**Required Fidelity Surfaces**

- Fonts and typography: passed; existing dialog title, label, description, and
  button typography is preserved.
- Spacing and layout rhythm: passed; the date and time steps use the current
  field rhythm, compact grids, and existing dialog width without overflow.
- Colors and visual tokens: passed; selected date/time buttons use the existing
  tenant primary treatment and all other controls retain current surface and
  border tokens.
- Image quality and asset fidelity: passed; no raster asset changed, and the
  date control reuses the existing calendar icon library.
- Copy and content: passed; the dialog explains the date-first order, labels
  both steps, confirms the selected slot, and retains interpreter guidance.
- Interaction and accessibility: passed; date/time controls are semantic
  buttons with `aria-pressed`, time controls are absent until a date is chosen,
  and the final action remains disabled until both selections exist.

**Primary Interactions Tested**

- The dialog initially shows five Admin-open dates and no time buttons.
- Selecting a date reveals only that weekday's four configured tenant times.
- Selecting one time enables **Schedule meeting** and displays the complete
  selected date/time summary.
- A separate clean browser tab completed the same flow with no console errors
  or warnings.
- The visual QA did not submit the final meeting action, so live match/meeting
  records were not changed.

**Comparison History**

- Iteration 1 replaced the scrolling 20-checkbox list with five date buttons
  and a conditional time grid. The first type check found a duplicate local
  formatter name; it was renamed before the clean browser capture.
- The post-fix combined comparison shows the intended single-screen hierarchy,
  no hidden footer controls, and no remaining P0/P1/P2 difference from the
  annotated outcome.

**Final Result**

- final result: passed

---

**Vendor Pending Meeting And Scheduling Verification — 2026-07-30**

**Source Visual Truth**

- Browser Comments 1 and 2 capture of the authenticated English Partner Vendor
  **My Matches** page.
- Source capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-meeting-source.jpg`.
- The selected mutually accepted card showed **Meeting ready** and **View
  meeting** even though its only active row had already started. The requested
  outcome was **Pending meeting** with **Schedule meeting**, switching to
  **View meeting** only when a future meeting exists.

**Implementation Evidence**

- Route: `http://localhost:3000/en/vendor?section=matches`.
- Match-card capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-pending-meeting-implementation.jpg`.
- Scheduling-dialog capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-schedule-dialog-implementation.jpg`.
- Full side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-meeting-full-comparison.jpg`.
- Focused side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-meeting-focused-comparison.jpg`.
- Source and implementation captures are both 1280 x 720 pixels from the same
  authenticated in-app browser, tenant, locale, and match data.

**Findings**

- No actionable P0, P1, or P2 visual, responsive, accessibility, or
  interaction issue remains.

**Required Fidelity Surfaces**

- Fonts and typography: passed; the existing badge, card, explanatory copy,
  and button typography is preserved.
- Spacing and layout rhythm: passed; the new status and action occupy the same
  positions and dimensions as the source controls.
- Colors and visual tokens: passed; **Pending meeting** and **Schedule
  meeting** reuse the current primary semantic treatment.
- Image quality and asset fidelity: passed; no image asset changed, and the
  calendar control uses the existing icon library.
- Copy and content: passed; the card names the pending state and explains that
  the schedule is shared by both Vendors.
- Interaction and accessibility: passed; **Schedule meeting** is a semantic
  button, opens the existing labelled dialog, and every slot remains a labelled
  checkbox.

**Primary Interactions Tested**

- A mutually accepted match with no future meeting shows **Pending meeting**
  and **Schedule meeting**.
- Started, completed, and cancelled rows do not hide scheduling.
- The dialog offers 20 one-hour choices across the next five Kuala Lumpur
  working days; the prior hard-coded past dates are gone.
- Selecting three slots enables the dialog's **Schedule meeting** action.
- An existing future meeting changes the state to **Meeting scheduled** and
  exposes **View meeting** with the locale-preserving My Meetings route.
- The live tenant was inspected read-only and was not modified during visual
  QA.

**Comparison History**

- Iteration 1 derived card state from future meeting time instead of the match
  status, which produced the requested pending state but exposed future
  Admin-created meetings on unaccepted cards. The state was restricted to
  mutually accepted matches.
- Iteration 2 opened the scheduling dialog and found hard-coded July 1–7 slots
  in the past. The options now derive the next five Kuala Lumpur working days;
  the post-fix capture starts on July 31.

**Final Result**

- final result: passed

---

**Vendor Sidebar Logout And Profile Actions Verification — 2026-07-30**

**Source Visual Truth**

- Browser Comments 1 and 2 capture of the authenticated English Delegation
  Vendor profile dialog on its **Access** tab.
- Source capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-profile-access-actions-source.jpg`.
- The source placed **Logout** and a redundant **Open Delegation page** link in
  the dialog footer. The requested outcome was to remove the role-page link and
  keep Logout permanently available at the bottom of the workspace sidebar.

**Implementation Evidence**

- Route: `http://localhost:3000/en/vendor`.
- Streamlined dialog capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-profile-access-actions-implementation.jpg`.
- Sidebar capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-sidebar-logout-implementation.jpg`.
- Full side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-profile-actions-full-comparison.jpg`.
- Focused side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-profile-actions-focused-comparison.jpg`.
- Source and implementation captures are both 1280 x 720 pixels from the same
  authenticated in-app browser viewport and tenant.

**Findings**

- No actionable P0, P1, or P2 visual, responsive, accessibility, or
  interaction issue remains.

**Required Fidelity Surfaces**

- Fonts and typography: passed; the existing account card, navigation, dialog,
  and ghost-action typography is reused.
- Spacing and layout rhythm: passed; the account card and Logout action form a
  compact bottom-anchored group without changing the navigation spacing.
- Colors and visual tokens: passed; Logout uses the current muted ghost-action
  treatment and existing logout icon.
- Image quality and asset fidelity: passed; no image asset was added or
  replaced.
- Copy and content: passed; the redundant role-page copy is gone while the
  account role, workspace, language, and password-recovery guidance remain.
- Interaction and accessibility: passed; Logout is a clearly labelled button
  available without opening the profile dialog, and the account card still
  opens the dialog.

**Primary Interactions Tested**

- The desktop sidebar keeps the account card and dedicated **Logout** action at
  its bottom edge.
- The mobile drawer uses the same account-and-logout group.
- The **Access** dialog retains account role, workspace, language, and password
  recovery.
- The dialog contains neither a Logout button nor an **Open Delegation page**
  link.
- Logout itself was not activated during visual QA because doing so would end
  the authenticated verification session; the existing logout flow remains
  covered by `AUTH-17`.

**Comparison History**

- Iteration 1 moved the existing logout action into the persistent sidebar
  group and removed both dialog-footer actions. The focused comparison shows
  the resulting shorter, single-purpose dialog, with no subsequent P0/P1/P2
  fix required.

**Final Result**

- final result: passed

---

**Delegation Dashboard Resources Verification — 2026-07-30**

**Source Visual Truth**

- Browser Comment 1 capture of the authenticated English Delegation Vendor
  dashboard.
- Source capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-dashboard-itinerary-source.jpg`.
- The annotated right-hand card was an empty **Malaysia itinerary** surface
  with a disabled download action. The requested outcome was to show the
  resources available to the Vendor in that space.

**Implementation Evidence**

- Route: `http://localhost:3000/en/vendor?section=dashboard`.
- Implementation capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-dashboard-resources-implementation.jpg`.
- Full side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-dashboard-resources-full-comparison.jpg`.
- Focused side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-dashboard-resources-focused-comparison.jpg`.
- Source and implementation captures are both 1280 x 720 pixels from the same
  authenticated in-app browser viewport and state.

**Findings**

- No actionable P0, P1, or P2 visual, responsive, accessibility, or
  interaction issue remains.

**Required Fidelity Surfaces**

- Fonts and typography: passed; the existing card title, description, resource
  metadata, and small-button typography are reused.
- Spacing and layout rhythm: passed; the resource rows fit the existing
  right-hand card without changing the dashboard grid or the adjacent summary
  card geometry.
- Colors and visual tokens: passed; rows, borders, muted metadata, and outline
  actions use the current dark-theme semantic tokens.
- Image quality and asset fidelity: passed; no image or icon asset was added or
  replaced.
- Copy and content: passed; the card now identifies itself as **Resources**,
  explains that the Admin shared the documents, and shows each permitted
  resource's title, category, and filename.
- Interaction and accessibility: passed; each resource exposes a semantic
  **Open** link with a visible label and new-tab safety attributes.

**Primary Interactions Tested**

- Two permitted Delegation resources render from the authorized Vendor data.
- Each visible resource exposes its existing file URL through **Open**.
- The resource selector excludes Admin/Partner audiences and rows without
  Delegation visibility in unit coverage.
- The complete itinerary and resource list remain available in **On-site**.
- Browser console errors: none.

**Comparison History**

- Iteration 1 replaced the empty compact itinerary surface with the existing
  resource-row pattern. The focused comparison shows unchanged card geometry
  and a clear, usable document list, with no subsequent P0/P1/P2 fix required.

**Final Result**

- final result: passed

---

**Vendor Match Unaccept Verification — 2026-07-30**

**Source Visual Truth**

- Browser Comment 1 capture of the authenticated English Vendor `My Matches`
  page with a one-sided accepted match.
- Source capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-acceptance-fixed-viewport-1954x1277.jpg`.
- The source showed `Pending other Vendor` twice and rendered the footer action
  as disabled. The requested behavior was to let this Vendor withdraw its own
  acceptance before the counterpart responds.

**Implementation Evidence**

- Route: `http://localhost:3000/en/vendor?section=matches`.
- Implementation capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-unaccept-implementation.jpg`.
- Focused before/after comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-unaccept-focused-comparison.jpg`.
- State: authenticated Delegation Vendor, English locale, dark tenant theme,
  and the same real one-sided match. The implementation was captured at
  1280 x 720; the focused comparison uses the same 500 x 340 card region on
  both sides to judge the changed state without conflating viewport density.

**Required Fidelity Surfaces**

- Fonts and typography: passed; the existing badge, explanatory copy, and
  button type styles are reused.
- Spacing and layout rhythm: passed; **Unaccept** occupies the same compact
  action position and the two-column match grid remains unchanged.
- Colors and visual tokens: passed; the new outline action and secondary badge
  use the existing semantic tokens.
- Image quality and asset fidelity: passed; no image or icon asset changed.
- Copy and content: passed; the badge says **Accepted by you**, the supporting
  sentence explains the withdrawal window, and the disabled duplicate pending
  label is gone.
- Interaction and accessibility: passed; **Unaccept** is a semantic enabled
  button, produces a clear confirmation toast, and restores the **Accept**
  action.

**Primary Interactions Tested**

- Activating **Unaccept** clears only the authenticated Vendor's timestamp,
  keeps the match `Proposed`, and immediately restores **Awaiting acceptance**
  with **Accept**.
- Accepting again restores the one-sided **Accepted by you** state.
- Database authorization tests confirm one-sided withdrawal succeeds while
  withdrawal after counterpart acceptance is denied.
- The database trigger also denies Vendor rejection, acceptance rewrites,
  cross-party decisions, and withdrawal after meeting creation.
- The real shared tenant was returned to its original one-sided accepted state
  after the browser interaction.
- Browser console errors: none; only normal local Fast Refresh messages were
  present.

**Final Result**

- final result: passed

---

**Vendor Two-Party MOU Signing Verification — 2026-07-30**

**Source Visual Truth**

- Browser Comment 1 capture of the authenticated English Vendor `MOU` page.
- The source showed a read-only four-column MOU table: one `Under Discussion`
  row and one legacy `Signed` row, both with an empty Action column and
  `Pending upload`.
- The requested behavior was to create a pending MOU automatically after
  meeting completion and let each Vendor explicitly tick and sign its side.

**Implementation Evidence**

- Route: `http://localhost:3000/en/vendor?section=signing`.
- Capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-mou-signing-implementation.png`.
- State: authenticated Delegation Vendor, English locale, dark tenant theme,
  same tenant navigation and real authorized MOU records.
- The implementation was reviewed beside the supplied source capture. It
  preserves the existing table, typography, navigation, and dark-theme tokens
  while using the previously empty Action column for signing progress.

**Required Fidelity Surfaces**

- Fonts and typography: passed; existing card, table, badge, body, and button
  styles are reused.
- Spacing and layout rhythm: passed; the status/action copy remains compact,
  aligned to each deal row, and introduces no horizontal overflow.
- Colors and visual tokens: passed; pending, signed, muted, border, and primary
  states use the existing semantic tokens.
- Image quality and asset fidelity: passed; no image asset was added, and the
  success mark uses the existing Hugeicons library.
- Copy and content: passed; the page states that completion creates the
  pending MOU, identifies that each Vendor signs for itself, and distinguishes
  unavailable, waiting, and fully signed states.
- Interaction and accessibility: passed; the unsigned completed-meeting state
  uses a semantic checkbox with an associated authorization label, disables
  **Sign MOU** until checked, and exposes progress in text as well as color.

**Primary Interactions Tested**

- Database tests confirm Admin meeting completion and pending-MOU creation
  commit atomically and remain idempotent.
- Signing without the explicit agreement is denied.
- The first participating Vendor records only its own signer/timestamp and
  receives `Agreement Reached`; the other side remains pending.
- The second participating Vendor produces `Signed` and `Verified`.
- Admin impersonation, foreign-tenant signing, and Vendor-triggered meeting
  completion are denied.
- Existing legacy signed rows are aligned to `Verified` and render as **Fully
  signed**; a deal without a completed meeting renders **Available after
  meeting**.
- The measured implementation viewport is 1280 × 720 with a 1280 px document
  width, so the populated action column introduces no horizontal overflow.
- Browser console errors: none; only normal local Fast Refresh messages were
  present.

**Final Result**

- final result: passed

---

**Vendor Meetings Empty-State Verification — 2026-07-30**

**Source Visual Truth**

- Browser Comment 1 capture of the authenticated English Vendor `My Meetings`
  page with the existing populated meeting schedule.
- Source capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-meetings-populated-source-1954x1277.jpg`.
- The requested behavior was to replace the generic blank schedule for Vendors
  with no meetings with clear accepted-match guidance and a direct route to
  **My Matches**.

**Implementation Evidence**

- Route: `http://localhost:3000/en/vendor?section=meetings`.
- Empty-state capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-meetings-empty-state-css-1954x1277.jpg`.
- Full side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-meetings-empty-state-comparison.jpg`.
- Focused side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-meetings-empty-state-focused-comparison.jpg`.
- Source and implementation captures are both 1954 x 1277 pixels from the same
  1954 x 1277 CSS viewport. The browser reported device pixel ratio 2; the
  implementation used CSS-scale capture so both images compare at one image
  pixel per CSS pixel.
- State: authenticated Delegation Vendor, English locale, dark tenant theme,
  and the same tenant navigation. The source is intentionally populated while
  the implementation evidence renders the requested zero-meeting condition.

**Full-view And Focused Comparison Evidence**

- The full comparison shows that the empty condition preserves the workspace
  proportions, navigation, selected `My Meetings` tab, schedule header, card
  width, and surrounding whitespace.
- The focused comparison makes the new hierarchy legible: existing meeting
  rows are replaced by one dashed empty panel, the icon and title are centered,
  the prerequisite is stated once, and **Go to My Matches** is the only action.
- Browser measurement reports 1954 px document width against a 1954 px client
  width, so the empty panel introduces no horizontal overflow.

**Required Fidelity Surfaces**

- Fonts and typography: passed; the existing heading, description, body, and
  button type styles are reused without introducing a new hierarchy.
- Spacing and layout rhythm: passed; the empty panel uses the existing schedule
  width and a compact centered composition instead of leaving an unstructured
  blank card.
- Colors and visual tokens: passed; the border, muted background, icon surface,
  copy, and primary button use existing project tokens.
- Image quality and asset fidelity: passed; no image asset was added or
  replaced, and the empty-state mark uses the project's existing Hugeicons
  library.
- Copy and content: passed; the message states that an accepted match is
  required before a meeting can be requested and names **My Matches** as the
  next destination.
- Interaction and accessibility: passed; the destination is a semantic link
  with a visible action label, preserves the locale, and updates the selected
  portal tab after same-route navigation.

**Primary Interactions Tested**

- Zero meetings render the `No meetings yet` state rather than the generic
  session sentence.
- **Go to My Matches** resolves to `/en/vendor?section=matches`.
- Activating the action shows the real match cards and selects `My Matches`.
- Populated Vendor schedules continue to render the existing meeting rows and
  actions.
- Browser console errors: none.

**Comparison History**

- Iteration 1 exposed a P1 navigation issue: the URL changed to
  `section=matches`, but the client-held tab could remain on `My Meetings`.
- The fix remounts the portal tab workspace whenever the validated route
  section changes, so the route remains the source of truth after same-page
  navigation.
- Iteration 2 selected `My Matches`, displayed the real match cards, preserved
  the schedule design language, and produced no actionable P0/P1/P2 visual,
  responsive, accessibility, or interaction issue.

**Final Result**

- final result: passed

---

**Vendor Mutual Match Acceptance Verification — 2026-07-30 (historical waiting control)**

**Source Visual Truth**

- Browser Comments 1–3 capture the authenticated English Vendor `My Matches`
  page before the acceptance repair.
- This evidence records the earlier disabled waiting control and is superseded
  by **Vendor Match Unaccept Verification** above.
- Source capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-discovery-enabled-source-1954x1277.png`.
- The source showed both matches as `Rejected`, kept the accepting Vendor in a
  pending state after pressing Accept, and exposed the unwanted `Request
change` action.

**Implementation Evidence**

- Route: `http://localhost:3000/en/vendor?section=matches`.
- Implementation capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-acceptance-fixed-viewport-1954x1277.jpg`.
- Full side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-acceptance-comparison-1954x1277.jpg`.
- Focused side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-match-acceptance-focused-comparison.jpg`.
- Source and implementation captures are both 1954 x 1277 pixels from the same
  1954 x 1277 CSS viewport. Browser capture normalized the device density to 1
  CSS pixel per image pixel.
- State: authenticated Delegation Vendor, English locale, dark tenant theme,
  and the same two match records. The implementation intentionally differs in
  workflow state: the first match contains the real persisted Delegation
  acceptance while its Partner acceptance remains empty.

**Full-view And Focused Comparison Evidence**

- The full comparison shows unchanged tenant navigation, discovery header,
  two-column match grid, card geometry, typography, and dark-theme tokens.
- The focused comparison makes the workflow correction explicit: the first
  match changes from `Rejected` to `Pending other Vendor`, its primary action is
  disabled, and the second match remains available for its own acceptance.
- `Request change` is absent from both cards.
- Browser measurement reports 1954 px document width against a 1954 px client
  width, so the new labels and actions introduce no horizontal overflow.

**Required Fidelity Surfaces**

- Fonts and typography: passed; existing card hierarchy, match metadata, and
  button typography are unchanged.
- Spacing and layout rhythm: passed; removing one action does not leave an
  awkward gap or change the two-column grid.
- Colors and visual tokens: passed; the workflow badges and buttons reuse the
  project's existing muted and primary tokens.
- Image quality and asset fidelity: passed; no image asset was added or
  replaced, and the tenant logo remains unchanged.
- Copy and content: passed; each card now describes whether this Vendor must
  accept, has accepted, is waiting for the other Vendor, can arrange a meeting,
  or can open the protected meeting link.
- Interaction and accessibility: passed; the waiting state is both disabled and
  text-labeled, the active Accept control remains keyboard-addressable, and no
  destructive Vendor rejection action remains.

**Primary Interactions Tested**

- Accepting a legacy `Rejected` row records only the current Vendor's
  acceptance, reopens the row to `Proposed`, and persists after reload.
- The accepted card shows `Pending other Vendor` and no longer exposes Accept.
- The unaccepted card shows `Awaiting acceptance` and retains Accept.
- Database authorization tests confirm a Vendor cannot reject, withdraw its
  acceptance, or write the other Vendor's acceptance.
- Database tests confirm the second party's acceptance advances the match to
  `Accepted`; unit tests then expose the meeting-arrangement state and the
  protected-link-ready state.
- The real shared tenant was not given a synthetic second-party acceptance.
- Browser console errors: none; only normal local Fast Refresh messages were
  present.

**Comparison History**

- Iteration 1 found the P0 root cause: the client wrote only an acceptance
  timestamp while the legacy row remained `Rejected`, so the database trigger
  cleared the timestamp and the action returned an apparent success.
- The repair makes acceptance one-way, reopens legacy rejected rows during the
  accepting update, protects each party's timestamp, and centralizes the
  user-facing progress calculation.
- Iteration 2 persisted the real acceptance, removed `Request change`, and
  produced no actionable P0/P1/P2 visual, responsive, accessibility, security,
  or interaction issue.

**Final Result**

- final result: passed

---

**Tenant Vendor Discovery Control Verification — 2026-07-30**

**Source Visual Truth**

- Browser Comment 1 capture of the authenticated English Vendor `My Matches`
  page with the existing `Find companies` entry point enabled.
- Source capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-discovery-enabled-source-1954x1277.png`.
- The requested behavior was to let the owning Admin disable Vendor
  self-service discovery, hide this entry point, and prevent direct access to
  its route.

**Implementation Evidence**

- Route: `http://localhost:3000/en/vendor?section=matches`.
- Disabled-state capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-discovery-disabled-1954x1277.png`.
- Side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-discovery-comparison.jpg`.
- Source and implementation captures are both 1954 x 1277 pixels from the same
  1954 x 1277 CSS viewport.
- State: authenticated Delegation Vendor, English locale, dark tenant theme,
  matching tenant and match records. The source is the enabled state; the
  implementation evidence is the Admin-disabled state.

**Full-view And Focused Comparison Evidence**

- The full-width comparison shows the complete self-service discovery card
  removed while the tenant navigation, `My Matches` selection, and two existing
  match cards remain in their original positions and visual treatment.
- The target and resulting card region are legible at full size, so a separate
  focused crop was unnecessary.
- Browser measurement reports 1954 px document width against a 1954 px client
  width, so the conditional state introduces no horizontal overflow.

**Required Fidelity Surfaces**

- Fonts and typography: passed; existing headings, labels, match metadata, and
  button typography are unchanged.
- Spacing and layout rhythm: passed; disabling discovery removes the whole CTA
  card cleanly and lets the match grid occupy the top of the content column.
- Colors and visual tokens: passed; the setting and Vendor state reuse the
  project's existing card, border, muted, switch, and primary tokens.
- Image quality and asset fidelity: passed; no image asset was added or
  replaced, and the tenant logo remains unchanged.
- Copy and content: passed; the Admin setting explains that Vendors may browse
  eligible companies and request matches themselves, with clear enabled and
  disabled supporting copy.
- Interaction and accessibility: passed; the Admin control uses a labeled
  switch, the Vendor CTA is absent when disabled, and the protected route
  redirects to `My Matches`.

**Primary Interactions Tested**

- Enabled state shows `Find companies` and preserves the two existing match
  counterpart names.
- Disabled state hides both the button and its containing discovery card.
- Opening `/en/vendor/discover` while disabled redirects to
  `/en/vendor?section=matches`.
- Existing match cards stay available with their real counterpart names while
  discovery is disabled.
- The enabled state was restored for the shared local tenant after the
  comparison.
- Browser console errors: none.

**Comparison History**

- Iteration 1 exposed a P1 data regression: reusing discovery candidates for
  existing match summaries caused counterpart names to fall back to `Company
record pending` when discovery was disabled.
- The fix added a restricted match-participant lookup that returns only
  companies already linked to the current Vendor's visible matches.
- Iteration 2 preserved existing match names, hid the CTA, redirected the
  direct route, and produced no actionable P0/P1/P2 issue.

**Findings**

- No actionable P0/P1/P2 visual, responsive, accessibility, security, or
  interaction issue remains in the verified Vendor state.
- The Admin switch is additionally covered by type checking, unit tests, and an
  authenticated-browser specification; the live visual comparison used the
  available Vendor session.

**Final Result**

- final result: passed

---

**Admin Meeting Actions Redesign Verification — 2026-07-30**

**Source Visual Truth**

- Browser Comment 1 capture of the authenticated English Admin dashboard before
  the meeting-action redesign.
- Source capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-meeting-actions-source-1954x1277.png`.
- The source showed meeting actions wrapping into a cramped cluster, a
  repeatable Complete action on already completed meetings, and the static Phase
  timeline selected for removal.

**Implementation Evidence**

- Route: `http://localhost:3000/en/admin`.
- Implementation capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-meeting-actions-after-1954x1277.png`.
- Confirmation-dialog capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-meeting-complete-confirmation-1954x1277.png`.
- Side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-meeting-actions-comparison.png`.
- Source and implementation captures are both 1939 x 1344 pixels from the same
  1939 x 1354 CSS viewport. The browser reported device pixel ratio 2; the
  Browser capture normalized both images to the same 1x CSS-pixel density.
- State: authenticated Admin, English dashboard, dark theme, matching meeting
  data and scroll position.

**Full-view Comparison Evidence**

- The static Phase timeline is absent and the live operating picture now uses
  the full content width without altering the header, metric cards, navigation,
  or tenant branding.
- Every meeting uses the same right-side action panel with a clear label and a
  predictable Join, View/Edit, Copy Link order.
- Completed meetings no longer expose Complete. Active meetings separate
  Complete from routine actions with a divider.
- Browser measurement reports 1939 px document width against a 1939 px client
  width, so the wider dashboard and action panels introduce no horizontal
  overflow.

**Focused Region Comparison Evidence**

- The full-width comparison keeps the action labels and meeting states readable,
  so a separate action crop was unnecessary.
- The dedicated confirmation-dialog capture verifies the important focused
  interaction state: meeting identity, editing-lock warning, safe Keep active
  exit, and explicit Confirm complete action.

**Required Fidelity Surfaces**

- Fonts and typography: passed; existing dashboard type, sizes, weights, line
  heights, and hierarchy are preserved.
- Spacing and layout rhythm: passed; action spacing is consistent, meeting
  content retains a flexible column, and the former timeline space is absorbed
  without dead space.
- Colors and visual tokens: passed; existing card, border, muted, primary, and
  overlay tokens are reused with no new palette.
- Image quality and asset fidelity: passed; no image assets were added or
  replaced, and the existing tenant logo remains unchanged.
- Copy and content: passed; controls use direct action labels, the confirmation
  warns that completion locks editing, and completed/cancelled states do not
  offer the action again.

**Primary Interactions Tested**

- Complete opens the confirmation dialog without changing meeting state.
- Keep active closes the dialog without submitting the completion action.
- Confirm complete is present as the only state-changing dialog action.
- Completed meetings show no Complete action.
- Browser console errors: none.

**Comparison History**

- The first post-change side-by-side comparison found no actionable P0/P1/P2
  issue. No visual-fix iteration was required.

**Findings**

- No actionable P0/P1/P2 visual, responsive, accessibility, or interaction
  issue remains in the verified state.

**Final Result**

- final result: passed

---

**Vendor White-Label Dashboard Verification — 28 July 2026**

**Source Visual Truth**

- Source capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-dashboard-source-1285x1354.png`.
- Viewport: authenticated Traditional Chinese Vendor dashboard at 1285 x 1354
  CSS px and 2x device density.
- The source showed three user-reported issues: Plexus platform branding in the
  Vendor navigation, Admin-wide program totals in the Vendor header, and an
  internal Supabase/Auth/RLS notice.

**Implementation Evidence**

- The implementation was inspected in the same authenticated browser session,
  route, locale, and 1285 x 1354 viewport after a full reload.
- The sidebar now resolves `AGA Ventures Sdn Bhd` and its saved tenant logo from
  the owning active Admin tenant.
- The Vendor header now exposes company-scoped profile readiness, pending
  matches, upcoming meetings, and active MOUs. The Traditional Chinese labels
  and supporting totals render without clipping.
- The internal persistence/Auth/RLS notice is absent.
- Browser measurement reports 1285 px document width against a 1285 px client
  width, so the page has no horizontal overflow.

**Required Fidelity Surfaces**

- Fonts and typography: passed. The existing family, hierarchy, weights, and
  responsive sizes are preserved.
- Spacing and layout rhythm: passed. The existing sidebar and four-card grid
  geometry remain unchanged.
- Colors and visual tokens: passed. Existing tenant workspace, sidebar, card,
  border, muted, and primary tokens are reused.
- Image quality and asset fidelity: passed. The saved Admin tenant logo is used
  directly with object-contain treatment and an initial fallback.
- Copy and content: passed. Platform branding and infrastructure wording are
  removed from the Vendor-facing dashboard, and metrics describe the current
  Vendor company.
- Interaction and accessibility: passed. Navigation remains semantic; tenant
  logo alternatives identify the workspace; no new console errors or overflow
  occurred during the final live-browser check.

**Findings And Comparison History**

- P1 branding: fixed by resolving the Vendor's owning Admin tenant through the
  existing tenant-scoped RLS policy and rendering its saved name/logo in every
  responsive navigation surface.
- P1 dashboard scope: fixed by replacing Admin aggregate cards with
  company-scoped Vendor metrics.
- P2 internal notice: removed from both Vendor subtype dashboards.
- No actionable P0/P1/P2 issue remains in the verified state.

**Final Result**

- final result: passed

---

**Admin Global Industry Selector Verification — 2026-07-28**

**Source Visual Truth**

- Browser Comment 1 embedded capture of the authenticated Admin Vendor editor
  at 1457 x 1354 CSS px.
- The source identified the free-text `Sector` input as the control to replace;
  the surrounding Vendor profile dialog is the layout and visual-system
  reference.

**Implementation Evidence**

- Route: `http://localhost:3000/zh-Hant/admin/vendors`.
- Authenticated implementation screenshot:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/industry-sector-picker.png`.
- Implementation pixels: 1457 x 1354 at a 1457 x 1354 CSS viewport and 1x
  capture density.
- State: CBA Vendor editor, sector picker open, `computer` search active.

**Full-view And Focused Comparison Evidence**

- The editor preserves the source dialog width, section structure, compact
  field density, dark tenant theme, labels, and footer action.
- The former input is replaced in place by a same-height combobox. Its popover
  aligns to the field, remains within the viewport, and shows readable group,
  code, and industry rows; the full-view capture is readable enough that a
  separate crop was not required.

**Required Fidelity Surfaces**

- Fonts and typography: passed; the existing interface family, weights, field
  sizes, truncation, and muted hierarchy are preserved.
- Spacing and layout rhythm: passed; the picker occupies the original
  two-column field slot and its overlay does not reflow the dialog.
- Colors and visual tokens: passed; existing popover, input, border, focus,
  muted, and selected-row tokens are reused.
- Image quality and asset fidelity: passed; the change introduces no image
  assets and uses the project's existing Hugeicons control icon.
- Copy and content: passed; the selector clearly identifies 87 industries
  across 22 UN ISIC Revision 5 groups and explains how a custom saved value is
  handled.
- Interaction and accessibility: passed; the labeled combobox exposes
  expanded state, search, grouped listbox options, selected state, keyboard
  command behavior, and a hidden submitted value. No runtime error overlay or
  Next.js issue indicator appeared during the live-browser check.

**Primary Interactions Tested**

- Existing custom sector text remains visible before replacement.
- Opening the picker exposes every ISIC group and division.
- Searching `62` resolves computer programming; searching `computer` returns
  only three directly relevant industries.
- Selecting an industry closes the picker and updates the visible submitted
  value. The test did not save, so production-backed Vendor data was not
  changed.

**Comparison History**

- Initial P2: the first fuzzy-search implementation displayed unrelated
  industries for `computer`.
- Fix: replaced fuzzy ranking with deterministic, case-insensitive
  all-search-term matching against the code, industry, and parent group.
- Post-fix evidence: the final screenshot shows only codes 26, 62, and 95 for
  the `computer` search.

**Findings**

- No actionable P0/P1/P2 issue remains in the verified state.

**Final Result**

- final result: passed

---

**Vendor Profile Documents Verification — 2026-07-28**

**Source Visual Truth**

- Browser comment screenshot:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-profile-documents-source.png`.
- The requested control was the footer-level `Upload PDF` action in the Vendor
  registration profile.

**Implementation Evidence**

- Route: `http://localhost:3000/zh-Hant/vendor`.
- Authenticated implementation screenshot:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-profile-documents-after.png`.
- Side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-profile-documents-comparison.png`.

**Viewport And State**

- Reference screenshot: 1214 x 1280.
- Implementation screenshot: 1270 x 1339 in a 1285 x 1354 browser viewport.
- Vendor profile scrolled to Supporting documents with one real uploaded PDF.
- Horizontal overflow: none (`scrollWidth` equals `clientWidth`, both 1285px).

**Design Review**

- The document library follows the existing dark white-label card, border,
  spacing, typography, and compact action-button system.
- The filename, size, timestamp, review action, and destructive action remain
  legible without displacing the surrounding registration form.
- Empty, loading, success, error, and deletion-confirmation states use the
  existing component language and preserve keyboard-accessible controls.

**Functional Review**

- A real PDF was uploaded to the private Supabase bucket.
- Review opened through a 60-second signed redirect without exposing the
  private storage path.
- Delete required confirmation and removed both metadata and the object.
- Post-test cleanup confirmed zero remaining test rows and zero test objects.

**Findings**

- No actionable P0/P1/P2 visual, overflow, or functional issues remain.

**Final Result**

- final result: passed

---

## Vendor registration profile verification — 2026-07-28

**Source Visual Truth**

- User-annotated Vendor profile screenshot from Browser Comment 4.
- Captured source: `.design-qa/vendor-profile-source.png`.
- Side-by-side comparison:
  `.design-qa/vendor-profile-source-vs-after.png`.

**Implementation Evidence**

- Route: `http://localhost:3000/zh-Hant/vendor`, authenticated Delegation Vendor,
  Company profile tab.
- Captured implementation: `.design-qa/vendor-profile-after.png`.
- Live viewport: 1285 x 1354; document width 1270, so no horizontal overflow.

**Requested Changes Verified**

- Removed the internal `Production account` label and company selector; the
  authenticated Vendor edits only its bound company.
- Added a compact top-level completion module with live valid-item count,
  percentage, and progress indicator.
- Made all 12 registration sections independently collapsible with a clear
  chevron and 48px minimum header target.
- Kept the existing sidebar, card system, spacing rhythm, and dark tenant theme
  while reducing the form's initial administrative framing.
- Added explicit input semantics and shared browser/server validation for year,
  URL, email, phone, introduction word count, conditional fields, and consent
  date.

**Primary Interactions Tested**

- All 12 section headers expose `aria-expanded`; Company information collapsed
  and reopened successfully.
- Completion changed live from 2/28 (7%) to 3/28 (11%) after a valid year and
  returned after the test value was removed.
- Invalid year, URL, and email values rendered field-level errors; form
  submission remained blocked and no save occurred.
- A clean authenticated reload opened the profile with no browser console
  errors.

**Comparison Findings**

- The source's long account-selector strip is replaced by a shorter,
  customer-facing header and completion summary without changing the core form
  grid.
- Collapsible headers create stronger section boundaries and visibly reduce
  scan cost while preserving the original field order and density when open.
- No actionable P0/P1/P2 visual or interaction issues remain.

**Final Result**

- final result: passed

---

**Mobile Navigation Readability Verification — 28 July 2026**

**Source Visual Truth**

- Source:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-mobile-sidebar-source-390x844.png`.
- The authenticated Traditional Chinese Admin drawer at 390 x 844 showed the
  issue reported by the user: a 292 px drawer, approximately 26 px navigation
  rows, 12 px labels, and small icons.

**Implementation Evidence**

- Implementation:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/mobile-drawer-larger-final-390x844.png`.
- Comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/mobile-drawer-size-comparison-390x844.png`.
- Source and implementation are both 390 x 844 CSS px and 390 x 844 captured
  pixels at 1x density.
- The implementation capture uses the same shared responsive drawer component
  under an authenticated Vendor session because the available browser session
  changed roles after the annotation. Admin-specific destinations and active
  state remain covered by the preceding Vendor-accounts sidebar verification;
  this comparison is limited to the shared mobile sizing, typography, spacing,
  account control, and interaction treatment.

**Full-View And Focused Comparison Evidence**

- The side-by-side full-view board clearly shows the intentional density
  change: drawer width increases from 292 px to 366 px at the same viewport.
- Primary and nested mobile rows now use fixed 48 px touch targets, 14 px
  labels, 20 px primary icons, wider horizontal padding, and larger group gaps.
- The account control is at least 56 px high with a 36 px avatar and 14 px
  identity copy. These controls are large enough to judge in the full-view
  comparison, so a separate crop was not required.

**Required Fidelity Surfaces**

- Fonts and typography: passed. The existing type family and weights are
  preserved; mobile labels increase from 12 px to 14 px.
- Spacing and layout rhythm: passed. The drawer now occupies 366 / 390 px,
  preserves a 24 px context strip, uses 48 px rows, and scrolls its navigation
  independently while keeping the account control available.
- Colors and visual tokens: passed. Existing sidebar, muted, border, focus, and
  primary active-state tokens are unchanged.
- Image quality and asset fidelity: passed. Existing Hugeicons and saved tenant
  logos remain in use; no substitute assets were introduced.
- Copy and content: passed for the requested sizing scope. Navigation copy is
  unchanged by the implementation.
- Interaction and accessibility: passed. Touch targets meet 48 px, the drawer
  has no horizontal overflow, links/tabs remain semantic, focus treatment is
  preserved, and the close and account controls remain reachable.

**Comparison History**

- Initial P1: the drawer used only 75% of the phone width and rendered
  navigation rows at approximately 26 px, making the menu difficult to scan and
  tap.
- First fix: increased the intended width and row classes. Browser measurement
  found the drawer width was still constrained by the Sheet side variant and
  tab rows were shrinking because of their flex basis.
- Final fix: applied the width override to the Sheet's left-side variant and
  made mobile navigation rows non-shrinking. Post-fix browser measurements are
  366 px drawer width, 48 px rows, 14 px text, and zero horizontal overflow.
- Desktop verification at 1403 x 1354 confirmed its existing 12 px labels,
  compact rows, and zero horizontal overflow are unchanged.
- No new console errors occurred during the final measurement and interaction
  pass.

**Final Result**

- final result: passed

---

**Admin Vendor-Accounts Sidebar Verification — 28 July 2026**

**Source Visual Truth**

- Desktop source:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-sidebar-source-1403x1354.png`.
- Mobile source:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-mobile-sidebar-source-390x844.png`.
- The authenticated Traditional Chinese Admin dashboard sidebar is the visual
  and interaction source for the dedicated Vendor accounts route.

**Implementation Evidence**

- Desktop implementation:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-vendor-sidebar-1403x1354.png`.
- Desktop comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-vendor-sidebar-comparison.png`.
- Mobile implementation:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-vendor-mobile-sidebar-390x844.png`.
- Mobile comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-vendor-mobile-sidebar-comparison.png`.
- Desktop viewport and pixels: source and implementation are both 1403 x 1354
  CSS px and 1403 x 1354 captured pixels.
- Mobile viewport and pixels: source and implementation are both 390 x 844 CSS
  px and 390 x 844 captured pixels.
- State: authenticated `/zh-Hant/admin` dashboard compared with authenticated
  `/zh-Hant/admin/vendors`, with the mobile drawer open in both mobile captures.

**Full-View And Focused Comparison Evidence**

- The desktop comparison shows the same 220 px sidebar frame, surface, border,
  spacing, icons, group controls, external destinations, and account control
  beside both routes.
- The mobile comparison shows the same drawer width, header, navigation rhythm,
  icon alignment, grouping, footer account control, and overlay treatment.
- The sidebar itself is large and legible in both full-view comparison boards,
  so a separate crop was not required.

**Required Fidelity Surfaces**

- Fonts and typography: passed. Family, size, weight, line height, wrapping, and
  hierarchy match the source sidebar.
- Spacing and layout rhythm: passed. Desktop grid width, sticky height, nav
  gaps, dividers, mobile drawer geometry, and footer placement are unchanged.
- Colors and visual tokens: passed. Existing sidebar, border, muted, hover, and
  primary active-state tokens are reused.
- Image quality and asset fidelity: passed. The saved tenant logo and existing
  Hugeicons render through the same components; no replacement assets were
  introduced.
- Copy and content: passed. Traditional Chinese navigation labels and the
  account identity are preserved, and Vendor accounts is highlighted on its
  route.
- Interaction and accessibility: passed. Clicking Vendor accounts opens the
  dedicated route, desktop and mobile navigation remain keyboard/role
  addressable, operational links return to the requested Admin section, the
  active link exposes `data-state="active"`, and no horizontal overflow occurs.

**Comparison History**

- Initial issue: `/admin/vendors` rendered as a standalone management page
  without the Admin workspace navigation.
- Fix: reused the responsive Admin navigation on the route, added its active
  destination state, and connected route-based links to Admin dashboard
  sections.
- Post-fix evidence: desktop and mobile source/implementation comparisons show
  no actionable P0/P1/P2 visual mismatch. Browser console errors: none.

**Final Result**

- final result: passed

---

**Customer-Facing Account Copy Verification — 28 July 2026**

**Source And Implementation Evidence**

- Source:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/account-copy-before-1315x1354.png`.
- Implementation:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/account-copy-after-1315x1354.png`.
- Viewport and pixels: 1315 x 1354 CSS px at 1x density; both captures are
  1315 x 1354 pixels.
- State: `/zh-Hant/admin`, account settings open, Access selected.
- The same-state source and implementation captures were reviewed together in
  one comparison input. A separate focused crop was unnecessary because both
  changed copy regions are clearly readable in the full-view captures.

**Required Fidelity Surfaces**

- Fonts and typography: passed; text size, weight, line height, and wrapping
  remain consistent.
- Spacing and layout rhythm: passed; the shorter wording preserves dialog
  geometry and surrounding alignment.
- Colors and visual tokens: passed; no token or contrast changes.
- Image quality and asset fidelity: passed; no image assets are involved.
- Copy and content: passed; customer-facing account copy no longer exposes the
  Supabase product name in the header or password-security explanation.
- Interaction and accessibility: passed; navigation, recovery, locale, and
  session controls are unchanged.

**Findings And Comparison History**

- Initial issue: infrastructure branding appeared twice in an end-user account
  dialog.
- Fix: replaced both instances with provider-neutral account and recovery copy,
  and removed the same header reference from Simplified Chinese and Thai.
- Post-fix evidence shows no clipping, wrapping regression, or adjacent visual
  change. No actionable P0/P1/P2 findings remain.

**Final Result**

- final result: passed

---

**Protected Portal Language Selector Verification — 28 July 2026**

**Source Visual Truth**

- Source capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/access-language-selector-before-1315x1354.png`.
- The authenticated Traditional Chinese Admin account-settings dialog exposed
  every routeable locale even though only four protected portal locales have
  complete translated workspace copy.

**Implementation Evidence**

- Implementation capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/access-language-selector-after-1315x1354.png`.
- Viewport and pixels: 1315 x 1354 CSS px at 1x density; source and
  implementation are both 1315 x 1354 pixels.
- State: `/zh-Hant/admin`, account settings open, Access selected, Traditional
  Chinese selected.
- Full-view comparison: the before and after captures were reviewed together in
  one browser comparison input at the same viewport and state.
- A separate focused crop was not required because all locale labels and the
  surrounding Access layout are legible in the full-view captures.

**Required Fidelity Surfaces**

- Fonts and typography: passed. Existing label styles, sizes, and weights are
  unchanged.
- Spacing and layout rhythm: passed. Four supported routes form one balanced
  row without changing the surrounding dialog geometry.
- Colors and visual tokens: passed. Existing outline, selected, primary, and
  muted tokens are preserved.
- Image quality and asset fidelity: passed. This control contains no raster or
  custom image assets.
- Copy and content: passed. The selector now shows only English, Simplified
  Chinese, Traditional Chinese, and Thai, matching documented protected portal
  support; partial placeholder locales are hidden.
- Accessibility and interaction: passed. The control is exposed as a named
  radio group with four route choices and the current locale remains checked.

**Findings And Comparison History**

- Initial issue: partial placeholder locales were presented as complete portal
  choices.
- Fix: introduced an explicit protected-portal locale list and rendered only
  its four fully translated routes in account settings.
- Post-fix evidence: the same-state implementation capture shows the compact
  four-choice row with no clipping, overflow, or adjacent layout regression.
- No actionable P0/P1/P2 findings remain.

**Final Result**

- final result: passed

---

**Admin Vendor-Type Picker Verification — 28 July 2026**

**Source Visual Truth**

- Browser annotation on the authenticated `/en/admin` Vendor-provisioning
  dialog requested a more polished replacement for the native subtype select.
- The annotated native control and the updated closed picker were reviewed
  together at the same 1315 x 1354 viewport.

**Required Fidelity Surfaces**

- Existing Admin visual language: passed. The picker reuses the portal's dark
  surface, border, muted, primary, typography, radius, and Hugeicons tokens.
- Information clarity: passed. Delegation and Partner now include distinct
  icons and short descriptions of how each company participates in Plexus.
- Interaction coverage: passed. Mouse and keyboard opening expose both options,
  the selected option updates in the trigger, and the submitted form retains the
  selected subtype through a controlled hidden value.
- Layout: passed. The closed picker stays within its grid column with no modal
  overflow; the expanded menu provides enough width for both descriptions.
- Accessibility: passed. The existing label names the combobox, and both
  choices are exposed as selectable options with visible selected state.

**Findings**

- No actionable P0/P1/P2 visual issues remain.

**Final Result**

- final result: passed

---

**Admin Account Settings Verification — 28 July 2026**

**Source Visual Truth**

- Browser annotation on the authenticated `/en/admin` User profile dialog
  requested a more capable popup with a mini sidebar, white-label controls,
  human-readable identity, and no exposed user or tenant UUIDs.
- The same authenticated dialog was captured before implementation and compared
  directly with the updated Profile panel in one browser review.

**Implementation Evidence**

- Local route: `http://localhost:3000/en/admin`.
- Updated Profile capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-account-settings-profile-after-1141x1354.png`.
- White label and Access sections were opened and inspected in the same
  authenticated session.

**Required Fidelity Surfaces**

- Existing Admin visual language: passed. The dialog reuses the portal's
  background, border, muted, primary, typography, radius, and Hugeicons tokens.
- Information architecture: passed. Profile, White label, and Access are
  separated through a compact responsive settings sidebar.
- Privacy and clarity: passed. Raw User ID and Tenant ID values are absent;
  display name, login email, role, and workspace name use human-readable labels.
- Interaction coverage: passed. Display-name save completed against Supabase;
  white-label controls expose logo upload, tenant identity, primary color, save,
  and login preview; Access exposes language, password recovery, and logout.
- Layout: passed at 1141 x 1354 with no clipping in the Profile and White label
  panels; tall Access content remains contained by the dialog scroll region.

**Findings**

- No actionable P0/P1/P2 visual issues remain.

**Final Result**

- final result: passed

---

**Admin Mobile Navigation Verification — 27 July 2026**

**Source Visual Truth**

- Browser annotation on the authenticated `/en/admin` workspace: the full navigation card occupied most of the phone viewport before the selected admin content.
- Same-state before capture at 390 x 844: `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-mobile-sidebar-before-390x844.png`.
- Same-state side-by-side comparison: `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-mobile-sidebar-comparison.png`.

**Implementation Evidence**

- Local route: `http://127.0.0.1:3000/en/admin`.
- Updated component: `/Users/chishiongtan/Documents/plexus-production/components/malayconnect-mvp.tsx`.
- Compact mobile state: `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-mobile-sidebar-after-390x844.png`.
- Open drawer state: `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-mobile-drawer-open-390x844.png`.
- Final annotated-state capture: `/Users/chishiongtan/Documents/plexus-production/.design-qa/admin-mobile-final-delegation-390x844.png`.

**Viewport And State**

- Mobile: 390 x 844, authenticated Admin, Dashboard selected for the before/after comparison.
- Nested navigation check: Companies expanded, Delegation selected, drawer closed automatically, and the compact bar updated to `Delegation`.
- Desktop: 1280 x 900, authenticated Admin, Delegation selected; the existing sidebar remained visible.

**Measured Results**

- Admin content moved from 502px to 98px from the top of the mobile viewport.
- Compact mobile navigation height: 62px.
- Mobile horizontal overflow: none (`scrollWidth` and viewport width are both 390px).
- The full menu remains available in an accessible left drawer with a visible close control and persistent account access.

**Required Fidelity Surfaces**

- Fonts and typography: passed. Existing product type scale, weights, and localized copy are preserved.
- Spacing and layout rhythm: passed. The large mobile interruption is replaced by one compact control while desktop spacing remains unchanged.
- Colors and visual tokens: passed. Existing sidebar, border, primary, muted, and background tokens are reused.
- Image and icon fidelity: passed. No new raster assets were required; the existing Hugeicons library supplies the menu icon.
- Copy and content: passed. No routes, navigation labels, account controls, or admin content were removed.

**Primary Interactions And Checks**

- Menu button opens the drawer.
- Companies expands to reveal Delegation and Malaysian partners.
- Selecting Delegation changes the active tab and closes the drawer.
- Desktop sidebar behavior remains intact at the `lg` breakpoint.
- Browser console errors: none.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: passed (25 tests).
- `npm run build`: passed.

**Comparison History**

- Before: every navigation item and the account panel rendered inline above the phone content.
- After: only brand, current section, and Menu remain inline; the complete navigation moves into an on-demand drawer.
- Side-by-side review found no remaining P0/P1/P2 mobile-navigation issues.

**Final Result**

- final result: passed

---

**Superadmin Sidebar And Admin Recovery Verification**

**Source Visual Truth**

- Browser annotation on `/en/superadmin` requested the horizontal management
  tabs use the established Admin workspace sidebar pattern.
- The annotated Admin tenant row requested password-reset access beside the
  existing tenant controls.
- Existing `ResponsiveTabsNav` behavior in the Admin portal was used as the
  implementation reference.

**Implementation Evidence**

- Route: `http://localhost:3000/en/superadmin`.
- Desktop browser viewport: 1171 x 1354, authenticated Superadmin.
- Verified desktop sidebar dimensions: 220 x 512.
- Verified active content width: 871.
- Verified document horizontal overflow: 0.

**Required Fidelity Surfaces**

- Navigation pattern: passed. Desktop uses the existing sidebar token system,
  active-primary treatment, icon library, workspace label, and account footer.
- Responsive behavior: passed in code and authenticated browser coverage. The
  desktop sidebar becomes a sticky mobile menu and left drawer below `lg`.
- Tenant controls: passed. An active tenant Admin receives a visible
  **Send reset link** action; a tenant without an active Admin receives the same
  disabled control.
- Security model: passed. The action revalidates Superadmin authority and the
  target Admin on the server, records a sanitized audit event, and asks
  Supabase to send the tenant-aware recovery link without exposing or setting
  the password.

**Primary Interactions Tested**

- Admin tenants is selected by default.
- Vendors sidebar navigation activates the Vendor directory.
- Returning to Admin tenants restores the tenant table.
- Sidebar and table states render with no horizontal overflow.
- The recovery action was deliberately not clicked during visual QA, so no real
  email was sent.

**Findings**

- No actionable P0/P1/P2 issues remain.

**Final Result**

- final result: passed

---

**Plexus Password-Recovery Email Verification — 28 July 2026**

**Source Visual Truth**

- Current-state inbox capture:
  `/var/folders/d8/t1mw66t10m5b3j173p40kqzc0000gn/T/TemporaryItems/NSIRD_screencaptureui_PZwYsR/Screenshot 2026-07-28 at 1.20.42 AM.png`.
- The source is the generic Supabase email being replaced, not a fidelity target.
- Same-input before/after comparison:
  `/tmp/plexus-auth-email-before-after.jpg`.

**Implementation Evidence**

- Local preview: `http://127.0.0.1:4174`.
- Desktop screenshot: `/tmp/plexus-auth-email-desktop-800.jpg`.
- Mobile screenshot: `/tmp/plexus-auth-email-mobile-390-final.jpg`.
- Version-controlled template:
  `/Users/chishiongtan/Documents/plexus-production/supabase/templates/recovery.html`.

**Viewport And State**

- Source pixels: 1222 x 656.
- Desktop implementation: 800 x 900 CSS px and 800 x 900 screenshot px,
  density normalized at 1:1.
- Mobile implementation: 390 x 844 CSS viewport, 375 x 913 full-page
  screenshot after browser scrollbar allocation, density normalized at 1:1.
- State: sample password-recovery email with non-production recipient and URL.
- No message was sent and no recovery token was consumed.

**Full-view Comparison Evidence**

- The generic white message and exposed Supabase sender are replaced by a
  centered, email-safe Plexus security card with clear hierarchy, CTA, safety
  note, fallback URL, and footer.
- The template cannot control the inbox sender identity; production SMTP must
  supply `Plexus Security` and a verified From address.

**Focused Region Comparison Evidence**

- The full-view comparison keeps the wordmark, heading, CTA, safety panel, and
  fallback link readable at once; no separate crop was required.

**Required Fidelity Surfaces**

- Fonts and typography: passed. System-safe sans-serif fallbacks, explicit
  weights, compact security kicker, and responsive heading wrapping remain
  readable across the two checked widths.
- Spacing and layout rhythm: passed. The 600px desktop card centers correctly,
  mobile padding compresses to 24px, and horizontal overflow is absent.
- Colors and visual tokens: passed. The approved `#071326` navy,
  `#0a84ff` electric blue, `#25d0ff` cyan, white, and cool-gray surfaces match
  the current Plexus product identity.
- Image quality and asset fidelity: passed. The real hosted Plexus wordmark is
  used with meaningful alternative text; no substitute logo or CSS artwork is
  present.
- Copy and content: passed. The message names the recipient, explains the
  action, avoids infrastructure language, states the one-time-link behavior,
  and includes a plain-link fallback.

**Primary Interactions And Checks**

- CTA and fallback links resolve to the sample recovery destination.
- Supabase `{{ .ConfirmationURL }}` and `{{ .Email }}` variables remain intact
  in the committed source.
- Desktop and mobile renders have no horizontal overflow.
- Browser console errors: none.
- Targeted template and password-recovery unit tests: passed.
- Documentation check: passed.

**Comparison History**

- Initial mobile render wrapped the CTA label to two lines.
- Fix: made the mobile CTA table full-width and kept the label on one line.
- Post-fix evidence: the CTA measures 301 x 50 CSS px and renders on one line.

**Findings**

- No actionable P0/P1/P2 visual issues remain.
- Hosted sender branding remains an operational configuration step because
  local HTML cannot change `Supabase Auth` in the inbox sender row.

**Final Result**

- final result: passed

**Public Website Verification**

**Source Brief**

- Browser annotation: Plexus public website spec for the marketing front door, sitemap, homepage sections, locale-backed copy, and shared tenant-aware footer.

**Implementation Evidence**

- Local URL: `http://localhost:3001/?lang=en`
- Homepage desktop screenshot: `/tmp/plexus-public-home.png`
- Homepage mobile screenshot: `/tmp/plexus-public-mobile.png`
- Bahasa Malaysia mobile route screenshot: `/tmp/plexus-public-ms-mobile.png`

**Viewport And State**

- Desktop: current in-app browser viewport, public homepage, unauthenticated, English locale.
- Mobile: 390 x 900, public homepage, unauthenticated, English locale.
- Additional route check: `/for-businesses?lang=ms`.

**Checks Run**

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Route probes: `/`, `/for-vendors`, `/for-businesses`, `/legal/privacy`, and `/help` returned 200 after dev server restart.
- Mobile overflow check: `scrollWidth` equals `innerWidth` at 390px.
- Browser console errors on homepage capture: none.

**Findings**

- No P0/P1/P2 issues remain for the implemented MVP public marketing layer.

**Notes**

- Social URLs and registered entity/SSM number are still intentionally marked as placeholders and need real production values.
- Footer tenant branding is implemented with a server-side hostname fallback and is ready to be connected to Supabase branding data when that row/schema exists.

**Final Result**

- final result: passed

---

**Plexus Superapp Login Verification — 28 July 2026**

**Source Visual Truth**

- Supplied reference:
  `/Users/chishiongtan/.codex/attachments/006925b8-422c-42c1-ae90-84c871b38c1a/image-1.png`.
- Same-viewport side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/login-reference-comparison.png`.

**Implementation Evidence**

- Platform login: `http://localhost:3000/en/login`.
- Tenant login:
  `http://localhost:3000/en/login?tenant=plexus-managed`.
- Desktop platform capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/login-platform-986x696.png`.
- Desktop tenant capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/login-glass-tenant-986x696.png`.
- Annotated-size glass capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/login-glass-tenant-616x1354.png`.
- Mobile platform capture:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/login-mobile-390x844.png`.

**Viewport And State**

- Desktop comparison: 986 x 696, unauthenticated platform login.
- Tenant check: 986 x 696, active `plexus-managed` branding.
- Tablet check: 768 x 1024.
- Mobile check: 390 x 844.
- Horizontal overflow: none at all checked widths.

**Required Fidelity Surfaces**

- Typography: passed. The Plexus display hierarchy, compact uppercase kicker,
  field labels, and supporting copy retain the supplied reference's hierarchy
  without exposing implementation language.
- Spacing and layout: passed. Desktop preserves the lower-left brand story and
  right-side translucent authentication card; tablet and mobile reflow without
  overlap or horizontal clipping.
- Colors and surfaces: passed. The deep-navy field, cyan primary action, 7%
  white glass tint, 32px backdrop blur, restrained border, and deeper shadow
  produce the requested transparent glass surface without reducing form
  legibility.
- Image quality: passed. Purpose-built high-resolution artwork derives directly
  from the Plexus X mark and preserves its electric-blue, cyan, and gold
  connection motif.
- Icons: passed. Existing Hugeicons provide consistent mail, password,
  visibility, security, support, and action symbols.
- Copy: passed. Supabase, portal routes, provisioning policy, route URLs, and
  self-signup status are absent from the public interface.

**Primary Interactions And Checks**

- Password visibility toggles between masked and visible text.
- Remember-me toggles correctly.
- Login submits through the existing server action.
- Invalid credentials return the generic user-facing error without provider
  details.
- Tenant mode renders the active Admin name, configured logo or branded
  fallback mark, primary color, and support contact.
- Tenant-bound sign-in validates the authenticated account's trusted
  `admin_id` before redirecting.
- `npm run verify:release`: passed, including target checks, docs, lint,
  typecheck, 29 unit tests, and the production build.

**Comparison History**

- Initial desktop pass matched the reference composition and required no P0,
  P1, or P2 visual correction.
- Interaction QA exposed an ambiguous browser test locator after adding the
  password-visibility control; the test now selects the exact Password field.
- Browser annotation requested a transparent glass background. The opaque
  violet tint was replaced with a 7% white surface, stronger backdrop blur,
  saturation, border definition, and shadow. Same-size 616 x 1354 and desktop
  post-fix captures show the network background through the card.
- Final platform, tenant, tablet, mobile, invalid-login, and interaction checks
  pass.

**Final Result**

- final result: passed

---

**Scoped `/app` UI Restyle Verification**

**Source Visual Truth**

- UI reference: `/Users/chishiongtan/Downloads/801C6E2C-3B37-4A66-B02E-C368D0365431.PNG`.
- Existing page structure: committed `/app` future-app showcase.
- Side-by-side comparison: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/reference-vs-restyled-app.png`.

**Implementation Evidence**

- Desktop screenshot: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/app-restyled-desktop.png`.
- Mobile screenshot: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/app-restyled-mobile.png`.
- Desktop state: top of `/app`, default interaction state.
- Mobile viewport: 390 x 844; no horizontal overflow.

**Full-view Comparison Evidence**

- The existing content structure, six generated feature images, narrative sections, module grid, roadmap, and CTA remain intact.
- The reference's `#071326` foundation, electric blue primary controls, cyan labels, white sans-serif headings, fine gray-blue borders, and compact radii are applied without converting the page into a dashboard.

**Focused Region Comparison Evidence**

- The full-view source comparison is readable at component level for the header, wordmark, primary button, labels, typography, borders, and dark surfaces; a separate crop was unnecessary.
- The supplied PLEXUS wordmark is used directly, and the existing Hugeicons remain unchanged.

**Required Fidelity Surfaces**

- Fonts and typography: passed. Heading treatment now follows the reference's clean sans-serif hierarchy while retaining the existing responsive scale and copy wrapping.
- Spacing and layout rhythm: passed. Original layout measurements and section order are preserved; only component styling changed.
- Colors and visual tokens: passed. Navy, electric blue, cyan, white, cool gray, borders, hover states, and dark surfaces align with the reference.
- Image quality and asset fidelity: passed. All six original generated feature images remain at their intended crops; the real PLEXUS wordmark replaces the text-only lockup.
- Copy and content: passed. No product narrative, module, roadmap, or feature content was removed or replaced.

**Primary Interactions And Routes Tested**

- `/`, `/about`, and `/app` all return 200; no legacy route hiding remains.
- Existing anchor navigation and contact CTAs remain available.
- Mobile overflow check passed (`scrollWidth` equals `innerWidth`, both 390px).
- Typecheck, lint, and production build passed.

**Findings**

- No actionable P0/P1/P2 issues remain.

**Comparison History**

- Earlier dashboard replacement was fully reverted after user clarification.
- Post-revert implementation preserves the original experience and applies only the requested UI-system restyle plus reusable primitives.

**Implementation Checklist**

- Previous `/app` restored.
- Existing routes restored.
- Reusable brand, button, label, and signal components added.
- Reference color and typography system applied.
- Desktop and mobile verified.

**Follow-up Polish**

- P3: future generated image variants could shift brass details toward cyan, but the current imagery remains coherent and was intentionally preserved.

**Final Result**

- final result: passed

---

**Future App `/app` Verification**

**Source Visual Truth**

- Supplied HTML: `/Users/chishiongtan/Downloads/plsxue.html`.
- Captured source: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/source-plsxue-desktop.png`.
- Full-view comparison: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/source-vs-app.png`.
- Focused feature comparison: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/source-vs-feature.png`.

**Implementation Evidence**

- Route: `http://127.0.0.1:3000/app`.
- Desktop screenshot: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/app-desktop.png`.
- Feature screenshot: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/app-feature.png`.
- Mobile screenshot: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/app-mobile.png`.

**Viewport And State**

- Desktop: 1440 x 1000, unauthenticated, top-of-page and first feature states.
- Mobile: 390 x 844, unauthenticated, top-of-page state.
- Mobile horizontal overflow: none (`scrollWidth` equals `innerWidth`, both 390px).

**Full-view Comparison Evidence**

- The implementation preserves the source's midnight navy canvas, warm-paper serif display type, brass italic emphasis, compact mono labels, restrained borders, and editorial spacing rhythm.
- The original text-only feature reel was intentionally elevated into a split hero with generated product imagery to meet the requested super-app introduction.
- Above-the-fold proportions, navigation weight, headline hierarchy, and content density remain faithful to the source while presenting a more product-led future vision.

**Focused Region Comparison Evidence**

- The Company Brain section retains the source's alternating image/copy structure, small jade phase label, large serif title, muted supporting copy, and brass signal panel.
- The source placeholder glyph was intentionally replaced with a purpose-built cinematic feature image. Crop, contrast, and visual density remain consistent with the hero art direction.

**Required Fidelity Surfaces**

- Fonts and typography: passed. Georgia provides the source's editorial serif character; existing Inter and Geist Mono variables provide legible product copy and labels with matching hierarchy and wrapping.
- Spacing and layout rhythm: passed. Desktop uses a stable 1240px content frame and generous section rhythm; mobile collapses cleanly with no horizontal overflow.
- Colors and visual tokens: passed. Navy, warm paper, brass, jade, and coral match the supplied source palette and retain accessible foreground contrast.
- Image quality and asset fidelity: passed. Six high-resolution generated assets share one cinematic paper/brass/smoked-glass direction and use responsive `next/image` rendering with meaningful alt text.
- Copy and content: passed. The narrative expands the supplied feature set into a clear super-app journey without changing the core PLEXUS/PLEXA proposition.

**Primary Interactions Tested**

- `Explore the future app` navigates to `#experience`.
- Header and CTA links expose valid destinations.
- Image hover treatment and responsive layouts render correctly.
- Browser console: no runtime errors. The initial LCP warning was resolved by eagerly loading the hero image.

**Comparison History**

- Initial pass: browser reported an LCP loading warning for the hero image.
- Fix: set the above-the-fold hero image to eager loading while retaining Next.js priority optimization.
- Post-fix evidence: typecheck, lint, production build, desktop render, feature render, mobile render, overflow check, and primary CTA test all passed.

**Findings**

- No actionable P0/P1/P2 issues remain.

**Follow-up Polish**

- P3: replace Georgia with Fraunces through `next/font` if exact typographic parity with the standalone HTML becomes a priority.

**Implementation Checklist**

- Six generated feature assets placed in the project.
- Responsive `/app` route implemented.
- Desktop and mobile layout verified.
- Core navigation and CTA verified.
- Typecheck, lint, and production build passed.

**Final Result**

- final result: passed

---

**Vendor Discovery Workspace Shell Verification — 2026-07-28**

**Source Visual Truth**

- Browser annotation:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-discovery-sidebar-source-1285x1354.png`.
- The source shows the white-label Vendor workspace and My matches screen
  immediately before the **Find companies** navigation.

**Implementation Evidence**

- Route: `http://localhost:3000/zh-Hant/vendor/discover`.
- Desktop screenshot:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-discovery-sidebar-after-1285x1354.png`.
- Mobile drawer screenshot:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-discovery-sidebar-mobile-390x844.png`.
- Side-by-side comparison:
  `/Users/chishiongtan/Documents/plexus-production/.design-qa/vendor-discovery-sidebar-comparison.png`.

**Viewport And State**

- Source pixels: 1214 x 1280 from a 1285 x 1354 browser viewport.
- Source normalized to 1285 x 1354 for the comparison.
- Desktop implementation: 1285 x 1354 pixels at a 1285 x 1354 CSS viewport.
- Mobile implementation: 390 x 844 CSS viewport with the navigation drawer
  open.
- State: authenticated Delegation Vendor, company discovery directory, one
  already-matched candidate.
- Horizontal overflow: none on desktop or mobile.

**Full-view Comparison Evidence**

- The destination now retains the source's tenant logo, white-label workspace
  name, full Vendor navigation, account control, sidebar width, card tokens,
  and page spacing.
- My matches remains visibly active while discovery is open, preserving the
  user's location in the workflow.
- The discovery search and candidate results occupy the existing content
  column rather than switching to a disconnected page shell.

**Focused Region Comparison Evidence**

- No separate crop was required: the full-view comparison renders the sidebar,
  active state, discovery heading, search control, and candidate action at
  readable size.

**Required Fidelity Surfaces**

- Fonts and typography: passed; existing workspace font sizes, weights, and
  hierarchy are reused.
- Spacing and layout rhythm: passed; the 220px desktop sidebar and responsive
  content column match the Vendor workspace grid.
- Colors and visual tokens: passed; sidebar, active-primary, border, muted
  copy, card, and button tokens are unchanged.
- Image quality and asset fidelity: passed; the saved tenant logo is reused
  with the existing initials fallback.
- Copy and content: passed; discovery behavior and candidate data are
  preserved while redundant Back to portal copy is removed.

**Primary Interactions Tested**

- Find companies navigates to `/zh-Hant/vendor/discover`.
- My matches is active in desktop and mobile navigation.
- Dashboard navigation returns to `/zh-Hant/vendor?section=dashboard` and
  opens the Dashboard section.
- The 390px navigation drawer opens with full-sized touch targets.
- Browser console errors: none.

**Comparison History**

- First post-change comparison found no actionable P0/P1/P2 mismatch.

**Findings**

- No actionable P0/P1/P2 visual, responsive, or navigation issues remain.

**Final Result**

- final result: passed
