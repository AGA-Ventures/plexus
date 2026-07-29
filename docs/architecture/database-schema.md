# Database Schema

**Owner:** Engineering and data/security
**Review trigger:** Every database migration
**Last verified against live Supabase:** 2026-07-28
**Project:** `Plexus` (`pnjblggcdigekluualin`)

## Source of truth

Committed migrations in `supabase/migrations/` are the schema source of truth.
This document is a reviewed human-readable snapshot of the live project plus
the next committed migration where explicitly marked.

Current live inventory after the Admin MOU document migrations:

- PostgreSQL 17
- 30 recorded migrations
- 24 public tables
- 24 of 24 public tables have RLS enabled
- 78 public-table RLS policies
- 0 public views and 0 public enum types
- 4 Storage buckets: private `event-resources`, public `tenant-branding`,
  private `vendor-profile-documents`, and private `mou-documents`
- Supabase security advisor: no error or warning findings on 2026-07-28; the
  two informational no-policy notices are the intentionally server-only
  `oauth_tokens` and `meeting_provider_links` tables

Status values are enforced with `CHECK` constraints rather than PostgreSQL enum
types.

## Core entity model

```mermaid
erDiagram
    AUTH_USERS ||--|| USER_PROFILES : "identity"
    ADMIN_TENANTS ||--o{ USER_PROFILES : "owns admins/vendors"
    ADMIN_TENANTS ||--o{ VENDOR_COMPANIES : "owns"
    VENDOR_COMPANIES ||--|| DELEGATION_COMPANIES : "delegation subtype"
    VENDOR_COMPANIES ||--|| PARTNER_COMPANIES : "partner subtype"
    VENDOR_COMPANIES ||--o{ USER_PROFILES : "binds vendor users"
    VENDOR_COMPANIES ||--o{ VENDOR_PROFILE_DOCUMENTS : "owns"
    ADMIN_TENANTS ||--o{ MATCHES : "scopes"
    DELEGATION_COMPANIES ||--o{ MATCHES : "participates"
    PARTNER_COMPANIES ||--o{ MATCHES : "participates"
    MATCHES ||--o{ MEETINGS : "schedules"
    MEETINGS ||--o| MEETING_PROVIDER_LINKS : "protects provider URL"
    MATCHES ||--o{ DEALS : "produces"
    DEALS ||--o| MOU_DOCUMENTS : "attaches"
    ADMIN_TENANTS ||--o{ SITE_VISITS : "scopes"
    SITE_VISITS ||--o{ SITE_VISIT_DELEGATIONS : "assigns"
    DELEGATION_COMPANIES ||--o{ SITE_VISIT_DELEGATIONS : "attends"
    ADMIN_TENANTS ||--o{ AUDIT_EVENTS : "scopes"
```

## Identity, tenancy, and governance

```text
admin_tenants (
  id uuid PK default gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  status text NOT NULL default 'active',
  support_email text NOT NULL default '',
  logo_url text NOT NULL default '',
  primary_color text NOT NULL default '#16839a',
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now()
)

vendor_companies (
  id uuid PK default gen_random_uuid(),
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  vendor_type text NOT NULL,
  name_en text NOT NULL,
  name_cn text NOT NULL default '',
  sector text NOT NULL default 'Pending',
  status text NOT NULL default 'active',
  created_by uuid NULL FK -> auth.users.id,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now(),
  UNIQUE (id, admin_id),
  UNIQUE (id, vendor_type)
)

user_profiles (
  id uuid PK FK -> auth.users.id,
  role text NOT NULL,
  display_name text NOT NULL,
  email text NOT NULL default '',
  admin_id uuid NULL FK -> admin_tenants.id,
  vendor_company_id uuid NULL,
  vendor_type text NULL,
  delegation_company_id uuid NULL FK -> delegation_companies.id,
  partner_company_id uuid NULL FK -> partner_companies.id,
  active boolean NOT NULL default true,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now(),
  FK (vendor_company_id, admin_id) -> vendor_companies(id, admin_id),
  FK (vendor_company_id, vendor_type) -> vendor_companies(id, vendor_type)
)

platform_settings (
  id uuid PK default gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  category text NOT NULL,
  value jsonb NOT NULL default null,
  description text NOT NULL default '',
  updated_by uuid NULL FK -> auth.users.id,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now()
)

audit_events (
  id uuid PK default gen_random_uuid(),
  actor_user_id uuid NULL FK -> auth.users.id,
  actor_role text NULL,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id uuid NULL,
  admin_id uuid NULL FK -> admin_tenants.id,
  request_id text NULL,
  before_values jsonb NULL,
  after_values jsonb NULL,
  created_at timestamptz NOT NULL default now()
)
```

Binding constraints:

- `superadmin`: no `admin_id`, Vendor company, or Vendor type.
- `admin`: `admin_id` required; Vendor company/type absent.
- `vendor`: `admin_id`, `vendor_company_id`, and `vendor_type` required.
- Role is limited to `superadmin`, `admin`, or `vendor`.
- Vendor type is limited to `delegation` or `partner`.
- Tenant and Vendor status is limited to `active`, `suspended`, or `archived`.

## Vendor company subtypes and discovery

```text
delegation_companies (
  id uuid PK default gen_random_uuid(),
  vendor_company_id uuid UNIQUE NOT NULL FK -> vendor_companies.id,
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  vendor_type text NOT NULL default 'delegation',
  name_en text NOT NULL,
  name_cn text NOT NULL,
  sector text NOT NULL,
  origin text NOT NULL,
  company_size text NOT NULL,
  needs text NOT NULL,
  contact text NOT NULL,
  contact_meta text NOT NULL,
  status text NOT NULL,
  profile_complete integer NOT NULL default 0,
  urgent boolean NOT NULL default false,
  coordinator text NOT NULL,
  profile_data jsonb NOT NULL default {},
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now(),
  UNIQUE (id, admin_id)
)

partner_companies (
  id uuid PK default gen_random_uuid(),
  vendor_company_id uuid UNIQUE NOT NULL FK -> vendor_companies.id,
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  vendor_type text NOT NULL default 'partner',
  name_en text NOT NULL,
  name_cn text NOT NULL,
  sector text NOT NULL,
  partner_type text NOT NULL,
  company_size text NOT NULL,
  offerings text NOT NULL,
  contact text NOT NULL,
  contact_meta text NOT NULL,
  status text NOT NULL,
  profile_complete integer NOT NULL default 0,
  verified text NOT NULL,
  attendance text NOT NULL,
  arrived boolean NOT NULL default false,
  profile_data jsonb NOT NULL default {},
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now(),
  UNIQUE (id, admin_id)
)

match_candidate_directory (
  company_type text NOT NULL,
  id uuid NOT NULL,
  name_en text NOT NULL,
  name_cn text NOT NULL,
  sector text NOT NULL,
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  PK (company_type, id)
)
```

Public Malaysian partner intake reuses the tenant-scoped `partner_companies`
record rather than creating an account-shaped staging identity. A public
submission is distinguishable by `profile_data.publicRegistration = true`,
starts with `verified = 'Pending'` and `status = 'Invited'`, and has no
`user_profiles` row. Qualification changes the operating status; account
provisioning is deliberately separate. The optional company logo URL is stored
in `profile_data.companyLogoUrl` after the image is written beneath the
tenant's `tenant-branding/{slug}/partner-registrations/` Storage prefix.

Subtype records and the candidate directory are synchronized by private
triggers. Vendor authorization uses the canonical `vendor_companies` identity;
subtype tables hold subtype-specific operating data.

Important checks:

- Profile completeness is between 0 and 100.
- Delegation status: `Onboarded`, `Invited`, `Incomplete`, or `Locked`.
- Partner type: `Government`, `Association`, or `Enterprise`.
- Partner status: `Sourced`, `Invited`, `Confirmed`, or `Declined`.
- Partner verification: `Verified`, `Pending`, or `Flagged`.
- Partner attendance: `Invited`, `Confirmed`, `Declined`, or `Arrived`.

## Matching, meetings, and deals

```text
matches (
  id uuid PK default gen_random_uuid(),
  delegation_company_id uuid NOT NULL FK -> delegation_companies.id,
  partner_company_id uuid NOT NULL FK -> partner_companies.id,
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  status text NOT NULL,
  score integer NOT NULL,
  note text NOT NULL,
  delegation_accepted_at timestamptz NULL,
  partner_accepted_at timestamptz NULL,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now(),
  UNIQUE (delegation_company_id, partner_company_id),
  UNIQUE (id, admin_id)
)

meetings (
  id uuid PK default gen_random_uuid(),
  match_id uuid NOT NULL FK -> matches.id,
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  starts_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  platform text NOT NULL,
  link text NOT NULL,
  interpreter text NOT NULL,
  requested_interpreter_id uuid NULL FK -> interpreters.id,
  host text NOT NULL,
  status text NOT NULL,
  summary text NOT NULL,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now()
)

meeting_provider_links (
  id uuid PK default gen_random_uuid(),
  meeting_id uuid UNIQUE NOT NULL FK -> meetings.id,
  slug text UNIQUE NOT NULL,
  provider text NOT NULL,
  topic text NULL,
  join_url text NOT NULL,
  provider_meeting_id text NULL,
  available_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  open_count integer NOT NULL default 0,
  max_opens integer NOT NULL default 10,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now()
)

oauth_tokens (
  id text PK,
  refresh_token text NOT NULL,
  access_token text NULL,
  expires_at timestamptz NULL,
  refresh_token_expires_at timestamptz NULL,
  updated_at timestamptz NOT NULL default now()
)

meeting_creation_jobs (
  id uuid PK default gen_random_uuid(),
  match_id uuid UNIQUE NOT NULL,
  admin_id uuid NOT NULL,
  provider text NOT NULL,
  status text NOT NULL,
  attempt_count integer NOT NULL default 1,
  failure_code text NULL,
  failure_summary text NULL,
  last_attempt_at timestamptz NOT NULL default now(),
  resolved_at timestamptz NULL,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now(),
  FK (match_id, admin_id) -> matches(id, admin_id)
)

deals (
  id uuid PK default gen_random_uuid(),
  match_id uuid NOT NULL FK -> matches.id,
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  status text NOT NULL,
  document text NOT NULL,
  signatory_check text NOT NULL,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now(),
  UNIQUE (id, admin_id),
  UNIQUE (match_id)
)

mou_documents (
  id uuid PK default gen_random_uuid(),
  deal_id uuid UNIQUE NOT NULL,
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  uploaded_by uuid NOT NULL FK -> user_profiles.id,
  file_name text NOT NULL,
  storage_path text UNIQUE NOT NULL,
  mime_type text NOT NULL default 'application/pdf',
  file_size bigint NOT NULL,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now(),
  FK (deal_id, admin_id) -> deals(id, admin_id)
)
```

Tenant-consistency foreign keys prevent a match, meeting, or deal from
referencing a record owned by another Admin tenant.

Important checks:

- Match score is between 0 and 100.
- Match status: `Proposed`, `Accepted`, `Rejected`, or `Session Scheduled`.
- `Accepted` and `Session Scheduled` require both acceptance timestamps.
- A Vendor can change only its own acceptance timestamp; the trigger derives
  `Accepted` only after both participating Vendors agree.
- Meeting platform: `Pending`, `Zoom`, `Lark`, or legacy `VooV`.
- Meeting status: `Scheduled`, `Live`, `Completed`, or `Cancelled`.
- Provider links require HTTPS, at least 32 slug characters, a positive access
  limit, and an expiry after their activation time.
- `oauth_tokens` and `meeting_provider_links` have RLS enabled, no
  anon/authenticated policies, and revoked browser-role grants. Only the
  server-only Supabase administration client can access them.
- `meeting_creation_jobs` is service-written and unique per match. Authenticated
  access is select-only and RLS permits only an active Superadmin, exposing
  sanitized status/failure fields rather than provider payloads.
- Deal status: `Under Discussion`, `Agreement Reached`, `Signed`, or `Failed`.
- Signatory check: `Verified`, `Pending`, or `Flagged`.

## Event operations

```text
interpreters (
  id uuid PK default gen_random_uuid(),
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  name text NOT NULL,
  languages text NOT NULL,
  email text NOT NULL default '',
  notes text NOT NULL default '',
  available boolean NOT NULL default true,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now()
)

itinerary_slots (
  id uuid PK default gen_random_uuid(),
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  day_label text NOT NULL,
  start_time text NOT NULL,
  activity text NOT NULL,
  venue text NOT NULL,
  escort text NOT NULL,
  published boolean NOT NULL default false,
  sort_order integer NOT NULL default 0,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now()
)

site_visits (
  id uuid PK default gen_random_uuid(),
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  venue text NOT NULL,
  visit_date date NOT NULL,
  start_time text NOT NULL,
  driver text NOT NULL,
  escort text NOT NULL,
  status text NOT NULL,
  notes text NOT NULL,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now()
)

site_visit_delegations (
  site_visit_id uuid NOT NULL FK -> site_visits.id,
  delegation_company_id uuid NOT NULL FK -> delegation_companies.id,
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  PK (site_visit_id, delegation_company_id)
)

liaison_contacts (
  id uuid PK default gen_random_uuid(),
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  name text NOT NULL,
  title text NOT NULL,
  organisation text NOT NULL,
  status text NOT NULL,
  protocol text NOT NULL,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now()
)
```

Site-visit status is `Planned`, `Confirmed`, or `Completed`. Liaison status is
`Draft`, `Confirmed`, or `Briefed`.

## Communications and resources

```text
announcements (
  id uuid PK default gen_random_uuid(),
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  title text NOT NULL,
  message text NOT NULL,
  target text NOT NULL,
  channel text NOT NULL,
  status text NOT NULL,
  sent_at timestamptz NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now()
)

notifications (
  id uuid PK default gen_random_uuid(),
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  message text NOT NULL,
  created_at timestamptz NOT NULL default now()
)

event_resources (
  id uuid PK default gen_random_uuid(),
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  title text NOT NULL,
  category text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  storage_path text NULL,
  audience text NOT NULL,
  visible_to_delegation boolean NOT NULL default false,
  notes text NOT NULL default '',
  created_at timestamptz NOT NULL default now(),
  updated_at timestamptz NOT NULL default now()
)

vendor_profile_documents (
  id uuid PK default gen_random_uuid(),
  admin_id uuid NOT NULL FK -> admin_tenants.id,
  vendor_company_id uuid NOT NULL,
  vendor_type text NOT NULL,
  uploaded_by uuid NOT NULL FK -> user_profiles.id,
  file_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  mime_type text NOT NULL default 'application/pdf',
  file_size bigint NOT NULL,
  created_at timestamptz NOT NULL default now(),
  FK (vendor_company_id, admin_id) -> vendor_companies(id, admin_id),
  FK (vendor_company_id, vendor_type) -> vendor_companies(id, vendor_type)
)
```

Announcement and resource audience is `all`, `delegation`, `partner`, or
`admin`. The `event-resources` Storage bucket is private, has a 15 MiB file
limit, and accepts PDF, JPEG, PNG, WebP, DOCX, and PPTX files.

The `tenant-branding` Storage bucket is public because tenant logos must render
on unauthenticated login pages. It has a 2 MiB file limit and accepts only PNG,
JPEG, and WebP. Logo objects are stored below the owning Admin tenant UUID.
Uploads are authorized by the application, checked by file signature, and
written through the server-only Supabase administration client.

The `vendor-profile-documents` Storage bucket is private, accepts only PDF, and
has a 6 MiB file limit. Objects use
`<admin_id>/<vendor_company_id>/<document_id>-<sanitized-file-name>` paths.
The route handler verifies the `.pdf` extension, declared MIME type, file size,
and `%PDF-` signature before upload. Metadata and object policies both require
the active Vendor's exact tenant/company binding. Authorized Admins and
Superadmins may read or delete within their existing governance scope, but the
Vendor UI exposes only its own company library. Review uses a 60-second signed
URL; delete removes the object and metadata record.

The `mou-documents` Storage bucket is private, accepts only PDF, and has a
10 MiB limit. Each deal has at most one authoritative metadata row, while a
replacement writes a new object before removing the superseded object. Paths
use `<admin_id>/<deal_id>/<upload_id>-<sanitized-file-name>`. Only the owning
Admin tenant may insert, replace, or delete; only that Admin and Vendors
participating in the deal's match may read. Review uses a 60-second signed URL,
and deal/document changes are written to `audit_events`. A database trigger
keeps the legacy deal document label synchronized in the same transaction as
metadata insert, replacement, or deletion.

## RLS access summary

| Data class              | Superadmin  | Admin                     | Vendor                         |
| ----------------------- | ----------- | ------------------------- | ------------------------------ |
| Tenants                 | All         | Own tenant                | Own tenant reference           |
| User profiles           | All         | Own tenant Vendors        | Own active profile             |
| Vendor directory        | All         | Own tenant                | Own company                    |
| Subtype profile         | All         | Own tenant                | Own subtype/company            |
| Candidate directory     | All         | Own tenant                | Opposite subtype in own tenant |
| Matches/meetings/deals  | All         | Own tenant                | Records involving own company  |
| Provider links/tokens   | Server only | Server only               | Server only                    |
| Itinerary               | All         | Own tenant manage         | Published own-tenant entries   |
| Site visits             | All         | Own tenant manage         | Assigned Delegation only       |
| Announcements/resources | All         | Own tenant manage         | Permitted audience             |
| Profile documents       | All         | Own tenant read/delete    | Own company upload/read/delete |
| Settings                | All/manage  | Provisioning setting read | None                           |
| Audit events            | All         | Own tenant read           | None                           |

All policies first require an active actor. Write policies use both `USING` and
`WITH CHECK` where applicable so a user cannot move a row outside its permitted
scope.

## Realtime publication

The `supabase_realtime` publication includes `delegation_companies`,
`partner_companies`, `matches`, `meetings`, and `deals`. The Vendor workspace
subscribes only to its own subtype/company row, its participating match rows,
and the meeting/deal rows related to its currently visible match IDs.
Postgres Changes authorization continues to use the tables' existing RLS
policies; the browser receives no service-role credential.

The client listens to insert and update events, then reloads the complete
authorized server read model so all four dashboard cards remain consistent.
Focus, visibility, and a 60-second recovery refresh cover missed connections
and deletion events without exposing unfilterable delete payloads.

## Public functions

| Function                          | Purpose                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------- |
| `current_app_role()`              | Read trusted role claim                                                           |
| `current_admin_id()`              | Read trusted tenant binding                                                       |
| `current_vendor_company_id()`     | Read trusted Vendor binding                                                       |
| `current_vendor_type()`           | Read trusted Vendor subtype                                                       |
| `current_delegation_company_id()` | Legacy subtype compatibility                                                      |
| `current_partner_company_id()`    | Legacy subtype compatibility                                                      |
| `match_candidates()`              | Return eligible name/sector summaries for discovery and participating match cards |
| `transfer_vendor(uuid, uuid)`     | Audited Superadmin Vendor transfer                                                |
| `touch_updated_at()`              | Timestamp maintenance trigger                                                     |

The public authorization helpers are invoker functions. Sensitive auditing,
binding protection, and synchronization logic lives in the unexposed
`private` schema.

## Schema change procedure

1. Run `npx supabase migration new short_description`.
2. Edit the generated migration; do not rewrite an applied migration.
3. Update this document and any affected security/module docs.
4. Test locally with `npm run test:rls`.
5. Review `npm run supabase:plan`.
6. Run database advisors.
7. Merge the migration and docs together.
8. Apply with `npm run supabase:push`.
9. Verify the live schema and update the verified date above.
