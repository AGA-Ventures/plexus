# Application Features by Role and Use Case

**Owner:** Product and engineering
**Review trigger:** Role, route, permission, workflow, or capability-status change
**Last reviewed:** 2026-07-28

## Purpose and scope

This guide explains the current Plexus application through its three
authorization layers:

1. **Superadmin** operates the whole Plexus platform.
2. **Admin** operates one isolated tenant and the Vendors assigned to it.
3. **Vendor** operates one company within an Admin tenant.

A Vendor has either a `delegation` or `partner` subtype. These subtypes change
the Vendor workspace and business workflows; they are not separate
authorization roles.

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

## Role hierarchy and scope

```mermaid
flowchart TD
    P["Plexus platform"] --> S["Superadmin<br/>all tenants"]
    S --> A1["Admin tenant A<br/>isolated scope"]
    S --> A2["Admin tenant B<br/>isolated scope"]
    A1 --> V1["Vendor company<br/>own-company scope"]
    A1 --> V2["Vendor company<br/>own-company scope"]
    A2 --> V3["Vendor company<br/>own-company scope"]
    V1 --> D["Delegation subtype"]
    V2 --> R["Partner subtype"]
```

The hierarchy describes data and governance scope, not automatic UI
inheritance. For example, a Superadmin has platform-wide authority and
reporting, but the Superadmin control center does not reproduce every screen in
the Admin operations portal.

## Role summary

| Role       | Primary outcome                                                                                     | Data scope                                         | Main workspace         |
| ---------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------- |
| Superadmin | Govern Plexus, its tenants, accounts, settings, and cross-tenant operations                         | All tenants and platform records                   | `/[locale]/superadmin` |
| Admin      | Run a branded tenant, manage its Vendors, and operate its business program                          | Own Admin tenant                                   | `/[locale]/admin`      |
| Vendor     | Maintain one company profile and participate in matching, meetings, agreements, and event workflows | Own company and explicitly shared workflow records | `/[locale]/vendor`     |

All roles use the same email/password login. Trusted Supabase Auth
`app_metadata` determines the role and bindings, after which the user is sent
to the correct workspace. All roles can request a self-service recovery email,
set a new password through a verified Supabase session, and return to the
correct tenant-branded login. Public self-signup is disabled.

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

| Capability                                               | Superadmin                                          | Admin                                                                      | Vendor                                                             |
| -------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Shared login, role routing, logout                       | Own account                                         | Own account                                                                | Own account                                                        |
| Self-service password recovery                           | Own account                                         | Own account                                                                | Own account                                                        |
| Account profile settings                                 | No dedicated self-service panel                     | Edit own display name; manage branding and access from one settings dialog | Edit own display name and review access                            |
| Admin tenant creation                                    | All tenants                                         | No                                                                         | No                                                                 |
| Tenant profile and branding                              | Upload logo, edit, and preview every tenant         | Upload logo, edit, and preview own tenant                                  | View applied workspace context                                     |
| Tenant activation, suspension, archiving                 | Every tenant                                        | No                                                                         | No                                                                 |
| Vendor account provisioning                              | Any active tenant                                   | Own active tenant, when platform setting permits                           | No                                                                 |
| Vendor company status and directory                      | Every tenant                                        | Own tenant                                                                 | Own profile through Vendor workflow                                |
| Vendor cross-tenant transfer                             | Yes                                                 | No                                                                         | No                                                                 |
| Account suspension/restoration and claim synchronization | All permitted accounts; cannot self-suspend         | Vendor accounts in own tenant                                              | No                                                                 |
| Admin password recovery link                             | Send to an active Admin account from its tenant row | Self-service only                                                          | No                                                                 |
| Platform settings                                        | Read/write                                          | Reads the Vendor-provisioning permission used by its workflow              | No                                                                 |
| Privileged audit history                                 | Platform-wide, latest 200 shown                     | Own tenant, latest 100 shown                                               | No                                                                 |
| Operational tenant reporting                             | Cross-tenant totals                                 | Full own-tenant dashboard and reports                                      | Own-company summaries                                              |
| Delegation and Partner records                           | Platform directory/reporting                        | Create, view, update, and delete within own tenant                         | Update own registration profile                                    |
| Match discovery                                          | No dedicated Superadmin UI                          | Manages own-tenant matching board                                          | Opposite-subtype directory; limited fields only                    |
| Match status and scoring                                 | No dedicated Superadmin UI                          | Propose, score, assign, and update own-tenant matches                      | Request, accept, reject/request change for own matches             |
| Meetings                                                 | Cross-tenant reporting                              | Schedule, view calendar, join, complete, and assign interpreters           | Request preferred times, join own meetings, export calendar invite |
| Interpreter roster                                       | No dedicated Superadmin UI                          | Create, edit, set availability, delete, and assign                         | Request an available preferred interpreter                         |
| MOU/deal tracking                                        | Cross-tenant reporting                              | Track status, signatory check, mark signed, preview/download available PDF | View own MOU status and preview/download available PDF             |
| Communications                                           | No dedicated Superadmin UI                          | Create targeted announcements and in-app notifications                     | View applicable operational notifications                          |
| Documents and resources                                  | No dedicated Superadmin UI                          | Add URL resources, upload private files, set audience and visibility       | Delegation subtype can view permitted resources                    |
| Event attendance and check-in                            | Cross-tenant reporting only                         | Manual/QR check-in simulation for tenant Partners                          | Partner subtype confirms attendance and sees QR status             |
| Itinerary, site visits, liaison                          | Cross-tenant reporting only                         | Publish itinerary; view site visits and liaison records                    | Delegation subtype views published itinerary                       |
| CSV/ICS exports                                          | Reporting on screen                                 | Pre-visit CSV, post-event CSV, and meeting calendar ICS                    | Meeting ICS; Delegation itinerary CSV                              |
| Compliance console and APIs                              | Platform access                                     | Own authenticated access                                                   | No                                                                 |

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

Temporary password delivery remains a controlled manual process.
Self-service password recovery is live; invitation and first-time password
setup flows are planned. A Superadmin can also send an audited, tenant-aware
password recovery link to an active Admin account without viewing or replacing
the password.

### Global Vendor governance

**Status: Live / Controlled**

- View Vendors across every Admin tenant.
- Search by company name or sector.
- Filter by owning Admin tenant and by Delegation/Partner subtype.
- Provision a Vendor company and confirmed Vendor Auth account in any active
  tenant.
- Edit directory name, Chinese name, and sector.
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
  start self-service password recovery, or end the current session.
- View own-tenant totals, fully matched Delegations, invited/arrived guests,
  signed MOUs, scheduled/completed meetings, conversion, notifications, and a
  phase timeline.
- Review the current session queue and mark a meeting complete.
- Edit the tenant name, support email, login logo, and primary color, then open
  an authenticated login-page preview without leaving account settings.
- Open Vendor account management, Vendor provisioning, and Compliance.
- Export a pre-visit report directly from the dashboard.

### Vendor and Vendor-account management

**Status: Controlled**

- Provision Delegation or Partner Vendors only inside the Admin's own active
  tenant, when platform Vendor provisioning is enabled.
- View Vendor subtype, sector, linked account count, and status.
- Edit Vendor directory name, Chinese name, and sector.
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
  within tenant scope.
- Inspect the full structured registration profile for a company.

Account provisioning and operational company-record management are distinct
workflows. Use the Vendor provisioning control when the company needs a login.

### Matching

**Status: Live**

- Select a Delegation and rank Partner candidates using sector, needs,
  offerings, verification, and profile-completeness signals.
- View predicted fit percentages.
- Assign a Partner to create a proposed match.
- Track `Proposed`, `Accepted`, `Rejected`, and `Session Scheduled` states.
- Update match state and schedule a meeting.
- Prevent duplicate Vendor-requested matches.

The score is an operational matching aid, not an autonomous approval or due
diligence decision.

### Meetings and interpreters

**Status: Live data model / Adapter provider**

- View meetings in calendar and session-list formats.
- Review company pair, date/time, duration, platform, host, interpreter,
  meeting status, agreement status, and summary.
- Export the tenant meeting calendar as an `.ics` file.
- Join a stored Zoom or VooV link.
- Mark a meeting complete and save the current fixed completion summary.
- Create, edit, set availability for, and delete interpreters.
- Review Vendor interpreter preferences and assign or clear the confirmed
  interpreter.

Meeting links are currently pre-generated placeholders. Production Zoom/VooV
creation, rescheduling, cancellation, reminders, and provider reconciliation
remain adapter work.

### MOU and deal tracking

**Status: Live tracking / Adapter document lifecycle**

- Track `Under Discussion`, `Agreement Reached`, `Signed`, and `Failed` states.
- View signatory-check status.
- Mark a deal signed.
- Preview, open, or download a PDF when a matching public document is present.

E-signature, collaborative review, secure deal-document upload, and provider
status reconciliation are not yet complete.

### Communications

**Status: Live data model / Adapter delivery**

- Target all participants, Delegations, Partners, or the Admin team.
- Select email, in-app notification, or both.
- Queue an announcement or mark it sent.
- Write in-app notifications immediately.
- Review the tenant announcement log and its audience, channel, and status.
- Use the protected Admin communications API.

Email records can be queued, but transactional email delivery is not connected
to a production provider.

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

- View the same protected integration-readiness console available to
  Superadmins.
- Query provider configuration status.
- Submit validated screening requests through the protected backend API.
- Keep provider credentials and raw calls on the server.

## Vendor features

### Shared Vendor workspace

Both Vendor subtypes receive the following features, restricted to their own
company and workflow participation.

#### Dashboard

**Status: Live**

- View company/profile identity, profile-completion percentage, match summary,
  next meeting, high-level program metrics, and the latest applicable
  operational notification.

#### Registration profile

**Status: Live, except document upload**

- Maintain company name, country/region, establishment and registration data,
  website, address, employee range, and revenue range.
- Maintain the primary contact, position, email, mobile, chat ID, and preferred
  languages.
- Record industries, company introduction, products/services, certifications,
  offerings, needs, preferred partner types, and expected outcomes.
- Describe the ideal partner, business opportunity, export experience, target
  markets, preferred meeting format, availability, and maximum meetings.
- Record supporting-document types and matchmaking consent.
- Recalculate profile completeness on save.
- Update only the Vendor's own company profile.

The **Upload PDF** button is currently a placeholder and does not persist a
profile document.

#### Discovery and matching

**Status: Live**

- Browse companies of the opposite Vendor subtype.
- Search by English name, Chinese name, or sector.
- See only the candidate ID, names, and sector; private profile/contact fields
  are not exposed by discovery.
- Request a match and receive a calculated fit score and note.
- Prevent duplicate requests for the same company pair.
- Review own matches and match confidence.
- Accept a proposed match or use **Request change**, which currently records
  the `Rejected` state.

#### Meeting request and participation

**Status: Live preferences / Adapter provider**

- Request a meeting only after the match is accepted.
- Select 3 to 6 future, one-hour weekday preferences.
- Optionally request an available interpreter.
- Let the Admin confirm the final time and interpreter.
- View own scheduled meetings and stored summaries.
- Open the stored meeting link.
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
  visibility is enabled.
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
    M --> C{"Match accepted?"}
    C -- "No" --> R["Reject / request change"]
    C -- "Yes" --> T["Vendor submits time<br/>and interpreter preferences"]
    T --> F["Admin confirms meeting<br/>and interpreter"]
    F --> J["Both Vendors join<br/>stored meeting link"]
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
| `/[locale]/vendor/discover`              | Vendor            | Opposite-subtype company discovery                      |
| `/[locale]/compliance`                   | Superadmin, Admin | Compliance integration readiness                        |
| `/[locale]/compliance/world-check`       | Superadmin, Admin | World-Check adapter status                              |
| `/[locale]/compliance/malaysia-ssm-ctos` | Superadmin, Admin | Malaysia SSM/CTOS adapter status                        |

Root aliases such as `/login`, `/admin`, `/vendor`, and `/superadmin` redirect
to English. Legacy `/delegation` and `/partner` paths redirect Vendor users to
the unified Vendor workspace.

The protected portal supports English (`en`), Simplified Chinese (`zh`),
Traditional Chinese (`zh-Hant`), and Thai (`th`). `cn` aliases to `zh`.

## Shared public application layer

The role-protected workspaces sit behind a public layer that includes:

- A public homepage and marketing pages for Vendors, businesses, how Plexus
  works, pricing, about, contact, help, and blog.
- Public privacy, terms, cookie, DPA, PDPA, and legal-information routes.
- Public marketing content in English, Bahasa Malaysia, and Traditional
  Chinese.
- Tenant-aware public branding based on a supported Plexus subdomain.
- A `/app` future-product showcase.

The `/app` showcase describes planned AI and trade-superapp concepts such as
Company Brain, live multilingual interpretation, Deal Radar, automated action
briefs, agreement drafting/e-signing, logistics, payments, and finance. It is a
concept experience and must not be read as the current protected application's
live feature set.

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

- Public signup.
- Invitation email, first-time password setup, automated credential delivery,
  and production SMTP/email branding.
- Production Zoom/VooV meeting creation and reconciliation.
- Production email and push-notification delivery.
- Secure MOU upload, collaborative review, e-signature, and document lifecycle.
- Production-secure QR generation and scanning.
- Complete compliance case management and configured provider coverage.
- Error tracking, uptime monitoring, product analytics, and alert ownership.
- The AI assistant and other `/app` future-superapp concepts.

See the [capability map](capability-map.md) and
[roadmap](../project-management/roadmap.md) for the maintained delivery status.

## Source references

- [Product vision and scope](vision-and-scope.md)
- [Superapp capability map](capability-map.md)
- [Routes and access](../architecture/routes-and-access.md)
- [System architecture](../architecture/system-overview.md)
- [Database schema](../architecture/database-schema.md)
- [Authorization and data security](../security/authorization-and-data-security.md)
- [Current project status](../reference/project-status.md)
