# Application Features by Role and Use Case

**Owner:** Product and engineering
**Review trigger:** Role, route, permission, workflow, or capability-status change
**Last reviewed:** 2026-08-26

## Purpose and scope

This guide explains the current Plexus application through its three
authorization layers and the product actors they represent:

1. **Superadmin** operates the whole Plexus platform.
2. **Admin / Organizer** operates one isolated tenant, manages Business
   Participants, and coordinates Local Service Partners.
3. **Business Participant** operates one participating company through the
   current technical `vendor` authorization role.

A Business Participant has either a `delegation` or `partner` subtype. These
subtypes change the current Vendor workspace and business workflows; they are
not separate authorization roles.

**Local Service Partner** is a distinct product actor for assigned operational
services such as interpretation, travel, transportation, venue,
accommodation, or logistics. It is not a fourth authorization role today:
current interpreters and concierge/service relationships are managed by the
Admin / Organizer. If service partners later receive logins, their access must
be assignment-scoped and must not inherit Business Participant or tenant-wide
permissions.

This is a current-state guide, not a future-product promise. Application code,
database migrations, and Row Level Security (RLS) remain the source of truth
when behavior changes.

## Capability status legend

| Status                | Meaning                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| **Live**              | Persisted in Supabase and protected by application authorization and RLS                                |
| **Controlled**        | Live, but requires approved users or a manual operational step                                          |
| **Adapter**           | The interface and data contract exist, but a production provider or end-to-end automation is incomplete |
| **Simulation**        | The screen demonstrates an operational step without completing a real external action                   |
| **Planned / concept** | Product direction only; not an available production workflow                                            |

## Public pre-event campaign

`/pre-event` is an anonymous, multilingual campaign page for international
companies and delegates preparing for an organizer-led business-matching
event. Its content leads from the visitor's business objective and target
connection to relevant ecosystem introductions, confirmed meetings, visit
details, and an arrival-ready itinerary. The relationship is framed as more
than a one-off introduction: context, logistics, and agreed next actions are
prepared around each meeting. A searchable worldwide
country directory sits within a campaign-specific emerald and warm-white
presentation using the transparent Plexus wordmark and a purpose-built image
of profile, matching, meeting, and arrival-plan preparation. The directory
prepares a localized WhatsApp inquiry to Plexus without
creating an account, submitting a form, or persisting visitor data.

Travel items on the page are a **Controlled** concierge handoff. Plexus may
coordinate a request or refer it to an approved event partner, but the page is
not a flight or hotel marketplace, visa authority, approval guarantee, or
payment surface. Introductions and local services remain subject to relevance,
availability, and organizer approval. Malaysia and Macao are labelled as the
current live-market focus; listing another country means inquiries are welcome,
not that provider delivery is already live there. Unapproved co-branding and
unverified contact channels are not rendered.

## Role hierarchy and scope

```mermaid
flowchart TD
    P["Plexus platform"] --> S["Superadmin<br/>all tenants"]
    S --> A1["Admin / Organizer tenant A<br/>isolated scope"]
    S --> A2["Admin / Organizer tenant B<br/>isolated scope"]
    A1 --> B1["Business Participant<br/>own-company scope"]
    A1 --> B2["Business Participant<br/>own-company scope"]
    A2 --> B3["Business Participant<br/>own-company scope"]
    B1 --> D["Delegation subtype"]
    B2 --> R["Partner subtype"]
    A1 -. "coordinates" .-> L1["Local Service Partner<br/>Admin-managed today"]
```

The hierarchy describes data and governance scope, not automatic UI
inheritance. For example, a Superadmin has platform-wide authority and
reporting, but the Superadmin control center does not reproduce every screen in
the Admin operations portal.

## Role summary

| Authorization role | Product actor        | Primary outcome                                                                                          | Data scope                                         | Main workspace         |
| ------------------ | -------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------- |
| `superadmin`       | Superadmin           | Govern the platform and standards across all tenants                                                     | All tenants and platform records                   | `/[locale]/superadmin` |
| `admin`            | Admin / Organizer    | Operate a branded tenant, manage Business Participants, and coordinate Local Service Partners            | Own Admin tenant                                   | `/[locale]/admin`      |
| `vendor`           | Business Participant | Represent one participating company and join permitted matching, meeting, agreement, and event workflows | Own company and explicitly shared workflow records | `/[locale]/vendor`     |

Local Service Partners do not have an independent workspace or authorization
role in the current application. Admin-managed interpreter records are the
existing controlled example; travel and logistics relationships remain
concierge handoffs until a scoped service-partner workflow is designed and
implemented.

All roles use the same email/password login. Trusted Supabase Auth
`app_metadata` determines the role and bindings, after which the user is sent
to the correct workspace. All roles can request a self-service recovery email,
set a new password through a verified Supabase session, and return to the
correct tenant-branded login. Public Auth self-signup is disabled; tenant
application links are
approval-gated intake and create no identity before review.

## Use-case overview

```mermaid
flowchart LR
    S(["Superadmin"])
    A(["Admin"])
    V(["Vendor"])
    D(["Delegation Vendor"])
    P(["Partner Vendor"])

    subgraph G["Platform governance"]
        G1["Provision Admin tenants"]
        G2["Govern every Vendor and account"]
        G3["Transfer Vendors across tenants"]
        G4["Configure platform settings"]
        G5["Review reporting and audit history"]
    end

    subgraph T["Tenant operations"]
        T1["Provision and manage Vendors"]
        T2["Manage company records"]
        T3["Score and operate matches"]
        T4["Coordinate meetings and interpreters"]
        T5["Track MOUs and event operations"]
        T6["Publish communications and resources"]
        T7["Export operational reports"]
        T8["Review compliance adapters"]
    end

    subgraph W["Vendor participation"]
        W1["Maintain company profile"]
        W2["Discover and request matches"]
        W3["Accept or reject matches"]
        W4["Request meeting times and interpreter"]
        W5["Join meetings and review MOUs"]
        W6["View alerts"]
        W7["View itinerary and resources"]
        W8["Confirm attendance and show QR status"]
    end

    S --> G1
    S --> G2
    S --> G3
    S --> G4
    S --> G5
    S --> T8

    A --> T1
    A --> T2
    A --> T3
    A --> T4
    A --> T5
    A --> T6
    A --> T7
    A --> T8

    V --> W1
    V --> W2
    V --> W3
    V --> W4
    V --> W5
    V --> W6
    V --> D
    V --> P
    D --> W7
    P --> W8
```

## Feature and permission matrix

| Capability                                               | Superadmin                                                                       | Admin                                                                       | Vendor                                                                         |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Shared login, role routing, logout                       | Own account                                                                      | Own account                                                                 | Own account                                                                    |
| Self-service password recovery                           | Own account                                                                      | Own account                                                                 | Own account                                                                    |
| Account profile settings                                 | No dedicated self-service panel                                                  | Edit own display name; manage branding and access from one settings dialog  | Edit own display name and review access                                        |
| Admin tenant creation                                    | All tenants                                                                      | No                                                                          | No                                                                             |
| Tenant profile and branding                              | Upload logo, edit, and preview every tenant                                      | Upload logo, edit, and preview own tenant                                   | View applied workspace context                                                 |
| Tenant activation, suspension, archiving                 | Every tenant                                                                     | No                                                                          | No                                                                             |
| Vendor account provisioning                              | Any active tenant                                                                | Own active tenant, when platform setting permits                            | No                                                                             |
| Vendor company status and directory                      | Every tenant                                                                     | Own tenant                                                                  | Own profile through Vendor workflow                                            |
| Vendor cross-tenant transfer                             | Yes                                                                              | No                                                                          | No                                                                             |
| Account suspension/restoration and claim synchronization | All permitted accounts; cannot self-suspend                                      | Vendor accounts in own tenant                                               | No                                                                             |
| Admin password recovery link                             | Send to an active Admin account from its tenant row                              | Self-service only                                                           | No                                                                             |
| Platform settings                                        | Read/write                                                                       | Reads the Vendor-provisioning permission used by its workflow               | No                                                                             |
| Privileged audit history                                 | Platform-wide, latest 200 shown                                                  | Own tenant, latest 100 shown                                                | No                                                                             |
| Operational tenant reporting                             | Cross-tenant totals                                                              | Full own-tenant dashboard and reports                                       | Own-company summaries                                                          |
| Delegation and Partner records                           | Platform directory/reporting                                                     | Create, view, update, and delete within own tenant                          | Update own registration profile                                                |
| Match discovery                                          | No dedicated Superadmin UI                                                       | Manages own-tenant matching board and controls Vendor self-service browsing | Opposite-subtype directory when enabled; limited fields only                   |
| Match status and scoring                                 | No dedicated Superadmin UI                                                       | Propose, score, and operate own-tenant matches                              | Request a match; own acceptance is reversible before the other Vendor responds |
| Meetings                                                 | Legacy critical incidents and controlled retry                                   | Confirm Vendor-requested sessions and create protected provider links       | Mutual acceptance unlocks scheduling; future sessions open in My Meetings      |
| Interpreter roster                                       | No dedicated Superadmin UI                                                       | Create, edit, set availability, delete, and assign                          | Request an available preferred interpreter                                     |
| MOU/deal tracking                                        | Cross-tenant reporting                                                           | Track status, signatory checks, and available PDF                           | Explicitly sign own side after a completed meeting; view progress/PDF          |
| Communications                                           | Cross-tenant Email sending ledger and provider readiness                         | Create targeted email announcements and in-app notifications                | Receive applicable operational email and notifications                         |
| Documents and resources                                  | No dedicated Superadmin UI                                                       | Add URL resources, upload private files, set audience and visibility        | Delegation subtype can view permitted resources                                |
| Event attendance and check-in                            | Cross-tenant reporting only                                                      | Manual/QR check-in simulation for tenant Partners                           | Partner subtype confirms attendance and sees QR status                         |
| TChina Expo registration                                 | Configure/publish the Plexus singleton; review, reject, and delete registrations | No access or navigation entry                                               | No protected access; any attendee may use the public questionnaire             |
| Itinerary, site visits, liaison                          | Cross-tenant reporting only                                                      | Publish itinerary; view site visits and liaison records                     | Delegation subtype views published itinerary                                   |
| CSV/ICS exports                                          | Reporting on screen                                                              | Pre-visit CSV, post-event CSV, and meeting calendar ICS                     | Meeting ICS; Delegation itinerary CSV                                          |
| Compliance console and APIs                              | Platform access                                                                  | Own authenticated access                                                    | No                                                                             |

Database RLS narrows Admin and Vendor actions to their permitted rows even
where a shared Server Action supports more than one role.

## Superadmin features

### Platform dashboard

**Status: Live**

- View counts for Admin tenants, active tenants, Vendors, active Vendors,
  accounts, suspended accounts, matches, meetings, and deals.
- Access the Compliance console.
- See a warning when the server-only Supabase administration credential is not
  configured. Directory and reporting access remain available, while
  privileged Auth account operations are locked.

### Admin tenant lifecycle

**Status: Controlled**

- Create an Admin tenant and its first Admin login.
- Capture tenant name, slug, support email, Admin display name, login email,
  and temporary password.
- Explain that the support email is the tenant-facing help contact while the
  Admin email is the first operator's private login and recovery identity.
- Require the temporary password to be entered twice and match before
  provisioning is submitted.
- Create a confirmed Supabase Auth account with trusted Admin claims and a
  matching active database profile.
- Edit tenant name, support email, and primary brand color.
- Upload a PNG, JPEG, or WebP login logo directly to tenant-scoped Supabase
  Storage, with an advanced HTTPS URL fallback for existing assets.
- Preview the tenant login presentation in an authenticated, sign-in-disabled
  browser tab before sharing the public tenant login.
- Change tenant state between `active`, `suspended`, and `archived`.
- View the number of Vendors assigned to each tenant.
- Roll back partial provisioning when a later creation step fails.

Direct Admin provisioning keeps the temporary password as an operator fallback
and also requests a secure Supabase Auth setup link. Self-service password
recovery and approved Vendor first-time password setup are implemented. A
Superadmin can also send an audited, tenant-aware password recovery link to an
active Admin account without viewing or replacing the password.

### Global Vendor governance

**Status: Live / Controlled**

- View Vendors across every Admin tenant.
- Search by company name or sector.
- Filter by owning Admin tenant and by Delegation/Partner subtype.
- Provision a Vendor company and confirmed Vendor Auth account in any active
  tenant.
- Edit full company, subtype, business-contact, account-holder, and login-email
  details while keeping the tenant and Vendor subtype binding protected.
- Change Vendor state between `active`, `suspended`, and `archived`.
- Transfer a Vendor, its users, and tenant-owned workflow records to another
  active Admin tenant through an audited operation.

### Account governance

**Status: Controlled**

- View account role, Admin binding, Vendor binding, and active state.
- Suspend or restore permitted accounts in both the database profile and
  Supabase Auth.
- Synchronize trusted Auth claims from the canonical database binding.
- Send a Supabase password recovery link to an active Admin from its tenant
  control row; the link returns to that tenant's branded password-reset flow.
- Prevent a Superadmin from suspending its own account through this control.
- Revert claim changes when mandatory audit logging fails.
- Record the recovery request before email delivery without storing the email
  address or recovery token in audit values.

### Reporting

**Status: Controlled**

- Compare each tenant's Vendor, match, meeting, and deal totals.
- Review platform-wide operational record totals.
- Use the report to identify tenant activity and operational coverage.

### Platform settings

**Status: Live**

- Maintain the default Admin plan.
- Enable or disable Admin-side Vendor account provisioning.
- Maintain supported-market reference data.
- Publish a platform operations notice.
- Store settings as JSON values or strings and record the updating user.

### Audit events

**Status: Live**

- Review the latest 200 privileged events across the platform.
- Search by action, table, role, or target identifier.
- Inspect actor, tenant, target, before/after values, request ID, and timestamp
  when recorded.
- Rely on append-only access for normal application roles.

### Critical meeting incidents

**Status: Live**

- Review and resolve previously recorded automatic Zoom or Lark meeting
  creation incidents.
- Review the affected tenant, match, provider, attempt count, and a sanitized
  failure category without exposing credentials or provider responses.
- Retry a recorded legacy failure from the Superadmin console while preserving
  the Vendors' accepted match.

### Compliance readiness

**Status: Adapter**

- View World-Check, Malaysia SSM, and CTOS configuration status.
- Review supported markets and the normalized screening payload.
- Access protected vendor-status and screening APIs.
- Run World-Check for configured markets and conditionally run SSM/CTOS for
  Malaysian companies after provider credentials are configured.

The current console is an integration-readiness view; it is not a complete
case-management or compliance-decision product.

## Admin features

### Tenant dashboard and settings

**Status: Live**

- Open a compact account-settings workspace with separate Profile, White
  label, and Access sections; edit the signed-in display name without exposing
  internal user or tenant UUIDs.
- Review the human-readable account role and workspace, change portal language,
  or start self-service password recovery. End the current session from the
  persistent bottom of the sidebar; account settings expose no redundant
  role-page launch action.
- View own-tenant totals, fully matched Delegations, invited/arrived guests,
  signed MOUs, scheduled/completed meetings, conversion, and notifications.
- Keep the Admin dashboard focused on operating metrics and workflow cards
  without internal tenancy or persistence notices.
- Review the current session queue and mark a meeting complete.
- Edit the tenant name, support email, login logo, and primary color, then open
  an authenticated login-page preview without leaving account settings.
- Reuse the saved white-label logo in the Admin account control and account
  settings identity panel, with the operator's initials as the fallback.
- Open Vendor accounts and Compliance from the Admin sidebar; retain the same
  responsive sidebar and active destination on both routes, with a
  near-full-width phone drawer and 48-pixel primary navigation touch targets.
  The Compliance destination currently exposes no provider, configuration,
  payload, market, or screening information and displays only `Pending`.
- Export a pre-visit report directly from the dashboard.

### Vendor and Vendor-account management

**Status: Controlled**

- Provision Delegation or Partner Vendors only inside the Admin's own active
  tenant, when platform Vendor provisioning is enabled.
- View Vendor subtype, sector, linked account count, and status.
- Edit company names, size, subtype-specific profile, primary contact, linked
  account-holder name, and login email. Select the sector from a searchable
  UN ISIC Revision 5 directory covering every global section and division;
  existing custom values remain visible until replaced. Login-email changes
  update the server-managed authentication identity without changing the
  password.
- Activate, suspend, or archive a Vendor company.
- Suspend or restore Vendor user accounts.
- Synchronize Vendor Auth claims with their database bindings.
- Review the latest 100 tenant audit events.

The Admin cannot create other Admins, transfer Vendors to another tenant, or
change platform settings.

### Company operations

**Status: Live**

- View separate Delegation and Malaysian Partner directories.
- Search records by company name, sector, origin/type, or status.
- Review profile completion, readiness, attendance, verification, and matching
  coverage metrics.
- Create, edit, inspect, and delete operational Delegation and Partner records
  within tenant scope. Select sectors from the same UN ISIC Revision 5
  directory used by Vendor accounts; the operational directory follows the
  saved sector and falls back to the Vendor's submitted profile sector for
  legacy records instead of presenting `Pending profile` as an industry.
- Inspect the full structured registration profile for a company.

Each Vendor edits only the company bound to the signed-in account, so the
profile does not expose an account selector. The form shows a live,
validation-aware completion percentage, lets Vendors collapse each registration
section, and validates year, URL, email, phone, introduction, and consent-date
formats in both the browser and the Server Action before persistence.

Account provisioning and operational company-record management are distinct
workflows. Use the Vendor provisioning control when the company needs a login.

### Matching

**Status: Live**

- Select a Delegation and rank Partner candidates using sector, needs,
  offerings, verification, and profile-completeness signals.
- View predicted fit percentages.
- Assign a Partner to create a proposed match.
- Enable or disable Vendor self-service company browsing for the entire tenant
  from Matching. Disabling it hides **Find companies**, redirects direct browse
  routes, returns no candidates, and blocks Vendor-created match requests while
  leaving Admin matching available.
- Track `Proposed`, `Accepted`, `Rejected`, and `Session Scheduled` states.
- Wait for each participating Vendor to record its own acceptance; the second
  acceptance unlocks the shared **Pending meeting** proposal action. Admins
  cannot accept on a Vendor's behalf. A Vendor may unaccept while its decision
  is still one-sided, but not after the other Vendor accepts or a meeting is
  arranged.
- Prevent duplicate Vendor-requested matches.

The score is an operational matching aid, not an autonomous approval or due
diligence decision.

### Meetings and interpreters

**Status: Live data model / Adapter deployment pending**

- Open a dedicated meeting-operations dashboard from the Admin sidebar.
- Review total, scheduled/live, completed, and booked-time metrics even when
  the tenant has no meetings yet.
- View the complete tenant-scoped meeting list and calendar, including
  completed and cancelled sessions.
- Review company pair, date/time, duration, platform, host, interpreter,
  meeting status, agreement status, and summary.
- Open any calendar entry or meeting-list row in a responsive details dialog.
  Admins can amend a meeting's time, duration, Zoom/Lark preference,
  interpreter, and agenda. Vendor pairing is immutable. Rescheduling a meeting
  that already has a protected link books a replacement provider meeting and
  issues a new link, retiring the previous one so it can no longer be used;
  the dialog states this before the change is saved. Completed and cancelled
  meetings are read-only.
- Copy the protected Plexus join link from the meeting row or details dialog
  once it is ready. The copy control remains disabled while acceptance or
  provider creation is pending and never exposes the raw Zoom/Lark URL.
- Manually select one delegation Vendor and one Malaysian partner, set a future
  time, Zoom or Lark preference, duration, interpreter, and agenda, and add the
  meeting to both Vendor calendars. Plexus creates or reuses the tenant-scoped
  match, rejects rejected pairs and duplicate times, and — because the
  arranging Admin is the scheduling authority — books the Zoom or Lark meeting
  and issues its protected join link immediately, without waiting for mutual
  acceptance. The override never records acceptance for a Vendor, so an
  undecided match keeps its `Proposed` status. If the provider is unreachable
  the meeting still reaches both calendars and the Admin is warned that the
  link is missing. Compact company names in the closed selectors prevent long
  sector labels from colliding with adjacent fields.
- Review truthful Zoom and Lark readiness plus protected-link readiness in
  Meeting settings. `Online` means the required server configuration,
  protected-link origin, and provider authorization are present; the provider
  API is validated again when a meeting is created.
- Publish recurring Monday–Friday Vendor booking availability from Meeting
  settings by opening or closing each supported 1-hour start time. The setting
  is tenant-scoped and audited with the existing Admin tenant update trail.
- Keep provider credentials and Lark authorization platform-managed while
  allowing tenant Admins to inspect readiness without viewing secrets.
- Export the tenant meeting calendar as an `.ics` file.
- Confirm the meeting time requested by an accepted Vendor pair and create the
  protected Zoom or Lark link.
- Join through an opaque Plexus link; never display the provider URL.
- Mark a meeting complete and save the current fixed completion summary.
- Create, edit, set availability for, and delete interpreters.
- Review Vendor interpreter preferences and assign or clear the confirmed
  interpreter.

Provider creation, the secure link gate, durable critical incidents, and
Superadmin retry are implemented in source. The Vercel credential setup,
migration application, one-time Lark authorization, and live Zoom/Lark smoke
tests remain release steps. Provider rescheduling, cancellation, reminders,
and reconciliation remain future work.

### MOU and deal tracking

**Status: Live two-party acceptance / Adapter document lifecycle**

- Track `Under Discussion`, `Agreement Reached`, `Signed`, and `Failed` states.
- Completing a meeting automatically creates the match's one pending MOU.
- Require each participating Vendor to tick the agreement and sign only for
  its own company.
- Show `Signed by you` while the counterpart is pending; mark the MOU `Signed`
  and its signatory check `Verified` only after both Vendor signatures.
- Record the authenticated signer and timestamp for each Vendor subtype.
- Preview, open, or download a PDF when a matching public document is present.

Qualified third-party e-signature certificates, collaborative redlining, and
provider status reconciliation remain future work. Private Admin MOU PDF
upload and participating-Vendor review are implemented.

### Communications

**Status: Live / Resend and Supabase Auth delivery**

- Target all participants, Delegations, Partners, or the Admin team.
- Select email, in-app notification, or both.
- Queue an announcement or mark it sent.
- Write in-app notifications immediately.
- Review the tenant announcement log and its audience, channel, and status.
- Use the protected Admin communications API.
- Send business and broadcast messages through Resend with one tracked row per
  recipient.
- Keep password recovery and first-time setup links under Supabase Auth while
  recording the request truthfully as `requested`.
- Record Resend sent, delivered, delayed, bounced, complained, suppressed,
  failed, opened, and clicked events through a signed webhook.
- Let Superadmin review cross-tenant provider readiness, delivery activity
  grouped by initiating sender, recipient status, and the complete action
  coverage register.
- Run authenticated scheduled reminders for pending applications, meetings
  about 24 hours away, and incomplete MOUs.

### Documents and resources

**Status: Live**

- Add a resource using an existing URL.
- Upload PDF, DOCX, PPTX, PNG, JPEG, or WebP files up to 15 MiB.
- Store uploaded files in a private Supabase Storage bucket.
- Categorize resources as agenda, map, briefing, logistics, or other.
- Set the audience to all, Delegation, Partner, or Admin.
- Toggle Delegation-portal visibility.
- Open files through an authenticated route and a short-lived signed URL.

### On-site operations

**Status: Mixed**

- **Guest check-in — Simulation:** View invited/arrived totals and perform a
  manual/QR-style Partner check-in that persists arrival status.
- **Itinerary — Live:** Publish or unpublish schedule slots for the Delegation
  workspace.
- **Site visits — Live read model:** View venue, date, time, escort, notes, and
  status. The current screen does not edit these records.
- **Official liaison — Live read model:** View government/official contacts,
  protocol notes, and readiness state. The current screen does not edit these
  records.

A production QR scanner, secure QR token validation, and on-site device flow
are not connected.

### Reports

**Status: Live**

- Export a UTF-8, Excel-ready pre-visit CSV with company pairs, fit scores,
  match states, meeting states/platforms, and notes.
- Export a post-event CSV with Partner sector, attendance, arrival,
  verification, and match counts.
- View headline session, signing, attendance, site-visit, and follow-up totals.

### Compliance

**Status: Adapter**

- Keep a protected Compliance destination in the Admin sidebar without
  exposing provider, configuration, route, payload, market, or screening
  information in the interface; the content area displays only `Pending`.
- Protected backend adapters remain server-only and are not surfaced through
  this hidden workspace.

## Vendor features

### Shared Vendor workspace

Both Vendor subtypes receive the following features, restricted to their own
company and workflow participation.

- Open profile and access settings from the bottom account card, and use the
  dedicated sidebar-bottom **Logout** action without opening the settings
  dialog.

#### Dashboard

**Status: Live**

- View company/profile identity, profile-completion percentage, match summary,
  next meeting, and company-scoped profile, pending-match, upcoming-meeting,
  and active-MOU metrics.
- Delegation Vendors see their permitted Admin-shared resources directly on
  the dashboard; the full published itinerary remains in **On-site**.
- Receive tenant-scoped live updates when the company profile, participating
  matches, related meetings, or related MOU records change; the workspace also
  refreshes on focus/visibility and periodically recovers if Realtime is
  interrupted.
- See the Admin tenant's saved white-label name and logo across desktop and
  mobile Vendor navigation instead of platform branding.
- Keep infrastructure implementation details out of the Vendor dashboard.

#### Registration profile

**Status: Live**

- Maintain company name, country/region, establishment and registration data,
  website, address, employee range, and revenue range.
- Maintain the primary contact, position, email, mobile, chat ID, and preferred
  languages; mobile entry includes a searchable calling-code picker for every
  supported country and region and stores one international phone value.
- Record industries, company introduction, products/services, certifications,
  offerings, needs, preferred partner types, and expected outcomes.
- Describe the ideal partner, business opportunity, export experience, target
  markets, preferred meeting format, availability, and maximum meetings.
- Record supporting-document types and matchmaking consent.
- See a live validated answered/total counter beside every collapsible section
  so remaining questions are visible before opening it.
- Upload PDF supporting documents to the own-company private library, with
  signature validation and a 6 MiB file limit.
- Review an uploaded PDF through a short-lived authorized link.
- Permanently delete an uploaded PDF after explicit confirmation.
- Recalculate profile completeness on save.
- Update only the Vendor's own company profile.

#### Discovery and matching

**Status: Live**

- Browse companies of the opposite Vendor subtype when the owning Admin has
  enabled Vendor discovery.
- Keep the white-label Vendor workspace sidebar available while browsing the
  discovery directory, with **My matches** shown as the active section.
- Return directly to the Vendor's own match list from the discovery header
  while preserving the selected portal locale.
- Search by English name, Chinese name, or sector.
- See only the candidate ID, names, and sector; private profile/contact fields
  are not exposed by discovery.
- Request a match and receive a calculated fit score and note.
- Prevent duplicate requests for the same company pair.
- Review own matches with an explicit **Your company ↔ Linked Vendor**
  relationship, counterpart name/sector, match confidence, both decisions, and
  a details action that never exposes the counterpart's private profile or
  contact fields.
- Record only its own acceptance. While the decision remains one-sided, the
  card shows **Accepted by you** and offers **Unaccept**; that control closes
  after the counterparty accepts or a meeting is arranged. Vendor rejection
  remains unavailable.
- Reopen a legacy `Rejected` match by accepting it; the match returns to
  `Proposed` while the other Vendor remains pending.
- When both Vendors accept and no future meeting exists, show **Pending
  meeting** with **Propose meeting**. Past, in-progress, completed, and
  cancelled rows do not hide this action.
- After one Vendor proposes a time, show **Awaiting Vendor approval** to that
  Vendor and **Meeting approval needed** with the exact time to the counterpart.
  The counterpart reviews the two-party approval record before approving.
- Only after both Vendors approve the same time does Plexus create the shared
  meeting, replace the primary action with **View meeting**, and expose it in
  **My Meetings**. Provider confirmation then exposes the protected link.

#### Meeting request and participation

**Status: Live scheduling / Adapter deployment pending**

- Unlock shared meeting scheduling only after both participating Vendors
  accept.
- Choose one Admin-open date first, then choose one available 1-hour time on
  that date and optionally request an available interpreter.
- Save the choice as a pending proposal with the proposing Vendor's approval.
- Require the matched counterpart to review and approve the exact time. A
  single approval never creates a meeting; the second approval atomically
  creates one shared meeting for both Vendors and sends it to the Admin for
  provider and interpreter confirmation.
- View own scheduled meetings and stored summaries.
- When no meeting exists, see that an accepted match is required before a
  meeting can be requested and return directly to **My Matches**.
- Open the expiring Plexus link without receiving the raw provider URL.
- Download an individual `.ics` calendar invitation.

#### MOU access

**Status: Live tracking / Adapter document lifecycle**

- View deals connected to the Vendor's own matches.
- Review MOU status, signatory-check status, and document name.
- Preview, open, or download an available PDF.
- See a pending state when no PDF exists.

The Vendor workspace does not currently provide a functioning counter-signed
document upload or e-signature workflow.

### Delegation Vendor

**Status: Live**

In addition to the shared Vendor features, a Delegation Vendor can:

- View only published itinerary slots for the Malaysia visit.
- View resources whose audience is `all` or `delegation` and whose Delegation
  visibility is enabled, including directly from the dashboard.
- Open authorized resource files.
- Export the published itinerary to CSV.
- See the assigned coordinator and the number of accepted/scheduled matches
  toward the current two-match operating target.

### Partner Vendor

**Status: Live state / Simulation QR**

In addition to the shared Vendor features, a Partner Vendor can:

- View attendance state and event venue information.
- Confirm event attendance.
- Display a generated QR-style status identifier.
- See when the Admin has marked the company as arrived.

The displayed QR is not yet a production-secure credential, and the application
does not yet perform a real camera scan or external access-control check.

## Main business workflow

```mermaid
flowchart LR
    S["Superadmin provisions<br/>Admin tenant"] --> A["Admin provisions<br/>Vendor login"]
    A --> P["Vendor completes<br/>company profile"]
    P --> D["Vendor discovers<br/>opposite subtype"]
    D --> M["Vendor or Admin<br/>proposes match"]
    M --> C{"Both Vendors accepted?"}
    C -- "No" --> R["Reject / request change"]
    C -- "Yes" --> T["Vendor submits time<br/>and interpreter preferences"]
    T --> F["Admin confirms meeting<br/>and interpreter"]
    F --> J["Both Vendors join<br/>protected Plexus link"]
    J --> O["Admin records completion<br/>and MOU status"]
    O --> E["Admin publishes itinerary,<br/>resources and event operations"]
    E --> X["Partner confirms attendance;<br/>Admin checks in guest"]
    X --> Q["Admin exports<br/>pre/post-event reports"]
```

## Routes and access

| Route                                    | Access            | Purpose                                                 |
| ---------------------------------------- | ----------------- | ------------------------------------------------------- |
| `/[locale]/login`                        | Public            | Shared login and role-directed routing                  |
| `/[locale]/forgot-password`              | Public            | Generic password-recovery email request                 |
| `/auth/callback`                         | Public            | Supabase PKCE code exchange for a recovery session      |
| `/[locale]/reset-password`               | Recovery session  | Set a new password for the recovered account            |
| `/[locale]/superadmin`                   | Superadmin        | Platform control center                                 |
| `/[locale]/login-preview`                | Superadmin, Admin | Authenticated, sign-in-disabled tenant branding preview |
| `/[locale]/admin`                        | Admin             | Tenant operations portal                                |
| `/[locale]/admin/vendors`                | Admin             | Tenant Vendor and Vendor-account management             |
| `/[locale]/vendor`                       | Vendor            | Delegation or Partner company workspace                 |
| `/[locale]/vendor/discover`              | Vendor            | Admin-enabled opposite-subtype company discovery        |
| `/[locale]/compliance`                   | Superadmin, Admin | Hidden Compliance workspace shell                       |
| `/[locale]/compliance/world-check`       | Superadmin, Admin | Hidden legacy Compliance route                          |
| `/[locale]/compliance/malaysia-ssm-ctos` | Superadmin, Admin | Hidden legacy Compliance route                          |

Root aliases such as `/login`, `/admin`, `/vendor`, and `/superadmin` redirect
to English. Legacy `/delegation` and `/partner` paths redirect Vendor users to
the unified Vendor workspace.

The protected portal supports English (`en`), Simplified Chinese (`zh`),
Traditional Chinese (`zh-Hant`), and Thai (`th`). `cn` aliases to `zh`.

## Shared public application layer

The role-protected workspaces sit behind a public layer that includes:

- A public homepage and marketing pages for Vendors, businesses, how Plexus
  works, pricing, about, contact, help, and blog.
- A multilingual contact FAQ covering program fit, pre-launch availability,
  operator and participant workflows, human-governed matching, languages,
  consultation pricing, scoped access, follow-up, and the next inquiry route.
- Public privacy, terms, cookie, DPA, PDPA, and legal-information routes.
- Public marketing content in English, Bahasa Malaysia, and Traditional
  Chinese.
- Tenant-aware public branding based on a supported Plexus subdomain.
- Tenant-specific Delegation and Partner application links. These collect a
  complete company profile for Admin review but do not create an account.
- A `/app` future-product showcase.

The `/app` showcase presents the complete superapp journey from company profile
and organizer review through matching, meetings, agreements, event operations,
governance, resources, reporting, and accountable follow-up. Company Brain,
Plexus Talk, Deal Radar, automated action briefs, assisted agreement drafting,
and PLEXA remain illustrative treatments. The page labels live, mixed,
adapter, and concept capability groups and must not be read as evidence that
every illustrated screen is production-ready.

## Authorization and safety model

```mermaid
flowchart TD
    B["Browser request"] --> P["Route proxy<br/>session and role shape"]
    P --> I["Server identity check<br/>active exact binding"]
    I --> O["Operation authorization<br/>role, tenant, company"]
    O --> R["PostgreSQL RLS<br/>row ownership"]
    R --> C["Constraints and triggers<br/>binding protection"]
    C --> A["Privileged audit event"]
```

- The browser, URL parameters, form fields, and Supabase `user_metadata` are
  untrusted.
- Trusted role bindings live in Supabase Auth `app_metadata` and must exactly
  match an active `user_profiles` row.
- Admin access requires an active Admin tenant.
- Vendor access requires an active Vendor company with the exact Admin,
  company, and subtype binding.
- Proxy checks, server authorization, RLS, constraints, and audit controls work
  together; hiding a UI control is not treated as authorization.
- Vendors can read shared matches, meetings, and deals only when their own
  company participates.
- The event-resource bucket is private and file downloads are authorized
  through the resource metadata and signed URLs.
- Tenant login logos use the public `tenant-branding` bucket so they render
  before authentication; application authorization, tenant scoping, file-size
  limits, and image-signature validation protect uploads.

## Known gaps and planned capabilities

The following are not complete production features:

- Open Auth self-signup remains intentionally unavailable. Vendor application
  intake is approval-gated.
- Final production SMTP credentials, branded Auth templates, and controlled
  mailbox evidence for first-time password setup.
- Production rollout and smoke verification of Zoom/Lark creation; provider
  update, cancellation, retry, and reconciliation.
- Production email smoke evidence, automated retry policy, unsubscribe rules
  where applicable, and push-notification delivery.
- Secure MOU upload, collaborative review, e-signature, and document lifecycle.
- Production-secure QR generation and scanning.
- Complete compliance case management and configured provider coverage.
- Error tracking, uptime monitoring, product analytics, and alert ownership.
- The AI assistant and other `/app` future-superapp concepts.

See the [capability map](capability-map.md) and
[roadmap](../project-management/roadmap.md) for the maintained delivery status.

## Tenant Vendor application use case

| Actor      | Available behavior                                                                                                                                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Applicant  | Open the tenant-branded subtype link, complete the 25 public-intake profile items plus any optional information and document checklist, submit without meeting-arrangement questions or credentials, and receive a generic awaiting-review confirmation. |
| Admin      | Copy either subtype link, view own-tenant pending/history applications and complete profiles, approve or reject pending applications, and resend setup email for an approved account.                                                                    |
| Superadmin | Read/update application records across tenants for governance under active-role RLS, without tenant impersonation in the Admin UI.                                                                                                                       |
| Vendor     | No application-table access. After approval and password setup, enter the existing Vendor workspace with the submitted profile prepopulated and upload private PDFs there.                                                                               |

## Source references

- [Product vision and scope](vision-and-scope.md)
- [Superapp capability map](capability-map.md)
- [Routes and access](../architecture/routes-and-access.md)
- [System architecture](../architecture/system-overview.md)
- [Database schema](../architecture/database-schema.md)
- [Authorization and data security](../security/authorization-and-data-security.md)
- [Current project status](../reference/project-status.md)
