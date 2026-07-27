# Plexus Business and Authorization Specification

**Status:** Source of truth for product, database, authentication, and UI development
**Version:** 1.0
**Date:** 2026-07-27

## 1. Product Model

Plexus is a multi-tenant platform with three business layers:

1. **Superadmin — Plexus internal team**
2. **Admin — a Plexus business partner or white-label operator**
3. **Vendor — the end-user business owner**

An Admin operates an isolated tenant. A Vendor belongs to exactly one Admin tenant. Superadmins operate across all tenants.

The existing `delegation` and `partner` concepts are retained as **Vendor subtypes**, not as separate top-level access roles:

- `vendor_type = delegation`
- `vendor_type = partner`

This keeps the domain distinction without creating two independent end-user security models.

## 2. Role Responsibilities

### 2.1 Superadmin (Plexus)

Superadmin is the platform owner and the only role that can control Admin accounts.

Superadmins can:

- View, create, edit, suspend, and archive every Admin tenant.
- View and manage every Vendor and Vendor subtype across all tenants.
- Assign or move a Vendor between Admin tenants, subject to audit logging.
- Create, suspend, and restore Admin and Vendor user accounts.
- Configure platform-wide settings, plans, permissions, reference data, and operational controls.
- View cross-tenant reporting, compliance records, communications, matches, meetings, deals, and resources.
- Review security and audit events.

Superadmin must not be created by an Admin, Vendor, public signup flow, SQL seed, or client-side request.

### 2.2 Admin (White-label business partner)

Admin is a tenant operator. Admin controls the Vendors assigned to that Admin tenant, but not Plexus or other Admin tenants.

Admins can:

- Manage their own tenant profile and white-label settings allowed by Plexus.
- Invite, activate, suspend, and manage Vendors in their tenant.
- View and operate on their Vendors' business records, matches, meetings, deals, itineraries, communications, and resources.
- Manage tenant-level workflows and reporting.
- View only data belonging to their own tenant.

Admins cannot:

- Create or promote another Admin or Superadmin.
- Change a user's tenant ownership without the permitted transfer workflow.
- Read or modify another Admin tenant.
- Change platform-wide security, billing, or authorization policy.
- Grant themselves Superadmin access by editing profile fields or metadata.

### 2.3 Vendor (End user)

Vendor is the business owner using Plexus services. A Vendor may be a delegation company or a partner company, but both use the same top-level role.

Vendors can:

- View and update their own company profile and permitted business data.
- Manage their own team members and delegated operational contacts, where enabled.
- Use the matching, meeting, deal, itinerary, communication, and resource workflows assigned to them.
- View only their own company data and records explicitly shared with them.

Vendors cannot:

- View another Vendor's private records.
- View Admin or Superadmin controls.
- Change their Admin tenant, role, subtype, or authorization bindings.
- Access data from another Admin tenant.

## 3. Canonical Identity and Tenant Model

The authorization model must be based on explicit database relationships, not email domains, URL parameters, UI state, or user-editable profile fields.

The target model is:

```text
Plexus platform
└── Admin tenant
    └── Vendor company
        └── Vendor users
```

Required concepts:

- `admin_tenants`: one row per white-label Admin business partner.
- `vendor_companies`: the unified Vendor company entity.
- `vendor_type`: `delegation` or `partner`.
- `user_profiles`: application profile for each Auth user.
- `admin_id`: the owning Admin tenant for Admin and Vendor users.
- `vendor_company_id`: the Vendor company binding for Vendor users.
- `audit_events`: immutable record of privileged changes.

The current `delegation_companies` and `partner_companies` tables may be preserved during migration, but all new authorization code must treat them as Vendor records and must carry an explicit Admin tenant relationship. A future consolidation can use one `vendor_companies` table; until then, the subtype must remain explicit and cannot be inferred from table access alone.

## 4. Supabase Auth Contract

Plexus uses Supabase Auth for identity and `app_metadata` for trusted authorization claims. `user_metadata` is never used for authorization.

The expected claim shapes are:

```json
{ "role": "superadmin" }
```

```json
{ "role": "admin", "admin_id": "<admin-tenant-uuid>" }
```

```json
{
  "role": "vendor",
  "admin_id": "<admin-tenant-uuid>",
  "vendor_company_id": "<vendor-company-uuid>",
  "vendor_type": "delegation"
}
```

```json
{
  "role": "vendor",
  "admin_id": "<admin-tenant-uuid>",
  "vendor_company_id": "<vendor-company-uuid>",
  "vendor_type": "partner"
}
```

Rules:

- `superadmin` has no tenant binding and is limited to approved Plexus operators.
- `admin` requires a valid `admin_id`.
- `vendor` requires a valid `admin_id`, `vendor_company_id`, and `vendor_type`.
- Every binding must reference an existing, active database record.
- Role and binding changes require a token refresh or sign-in before the new permissions are relied on.
- Account provisioning and metadata changes use the Supabase Auth Admin API or a trusted server-side workflow only.
- The service-role key is never exposed to the browser, client bundle, logs, or repository.
- Public signup is disabled for production. Accounts are invited or provisioned by an authorized operator.

## 5. Authorization and RLS Rules

Every exposed table must have RLS enabled and must implement the three-layer model explicitly.

The policy order is:

1. **Superadmin:** full platform access, subject to audit logging.
2. **Admin:** access only where `row.admin_id = current_admin_id()`.
3. **Vendor:** access only where `row.vendor_company_id = current_vendor_company_id()` or the record is explicitly shared with that Vendor.
4. **Unauthenticated:** no business data.

RLS helper functions should derive identity from the verified JWT and compare it against database relationships. They must fail closed when a claim is missing, malformed, inactive, or points to a nonexistent tenant.

Sensitive writes must verify both:

- the existing row is within the caller's scope (`USING`), and
- the new row remains within the caller's scope (`WITH CHECK`).

Do not use a public `SECURITY DEFINER` function to bypass RLS. If a privileged lookup is genuinely required, keep the function in a private schema, restrict execution, validate the caller, and run Supabase security advisors afterward.

## 6. Application Routing and UI

The application should expose three clear workspaces:

- `/superadmin`: platform-wide control center for Plexus staff.
- `/admin`: tenant operations for a white-label Admin.
- `/vendor`: end-user workspace for both delegation and partner Vendors.

During migration, `/delegation` and `/partner` may remain as compatibility routes that resolve to the Vendor workspace and enforce `vendor_type`. They must not become separate authorization roles.

The UI must hide controls that the caller cannot perform, but UI hiding is not a security boundary. Every server action, route, query, and mutation must enforce the same scope on the server and in RLS.

The Superadmin workspace must include:

- Admin tenant directory and status controls.
- Vendor directory with Admin and Vendor subtype filters.
- User/account status and role-binding management.
- Cross-tenant operational reporting.
- Audit event search and detail view.

## 7. Privileged Workflows

### 7.1 Create an Admin

1. Superadmin creates the Admin tenant record.
2. Superadmin creates or invites the Admin user through Supabase Auth.
3. The trusted server sets `app_metadata.role = admin` and the correct `admin_id`.
4. The system writes an audit event.
5. The Admin signs in and receives only tenant-scoped access.

### 7.2 Create a Vendor

1. Superadmin or the owning Admin creates the Vendor company record.
2. The operator selects the Vendor subtype: `delegation` or `partner`.
3. The operator creates or invites the Vendor user through Supabase Auth.
4. The trusted server sets the `vendor` claims and matching company binding.
5. The system writes an audit event.
6. The Vendor signs in and receives only its own company scope.

### 7.3 Move a Vendor Between Admins

Only Superadmin can perform a cross-tenant transfer.

The workflow must validate the destination tenant, update the database relationship, update the user's `app_metadata.admin_id`, revoke or refresh active sessions as appropriate, and write before/after values to the audit log. An Admin cannot perform this by changing a form field or metadata value.

### 7.4 Disable an Account

Disabling an account must stop new sign-ins and revoke or invalidate active sessions according to the chosen Supabase Auth session policy. The database record must also be marked inactive so RLS denies access if a stale token is presented.

## 8. Audit and Security Requirements

Audit events are required for:

- Admin and Vendor creation, suspension, restoration, and deletion.
- Role or tenant-binding changes.
- Vendor transfers between Admins.
- Superadmin access to cross-tenant records where practical.
- Impersonation or support access.
- Changes to authorization policy or platform configuration.

Audit records must include actor, target, action, timestamp, tenant context, request/session identifier when available, and before/after values for authorization changes. Audit records are append-only to normal application roles.

Impersonation is optional and must be disabled by default. If introduced, it requires an explicit Superadmin action, short-lived scoped sessions, a visible impersonation banner, and an audit event for start and stop.

## 9. Migration Rules

The new Supabase project is the target project for the application schema and RLS migrations. Auth users are separate from SQL data and must be recreated through Supabase Auth provisioning.

For existing data:

- Existing `admin` users become Admin users only after an explicit `admin_id` is assigned.
- Existing `delegation` users become `vendor` users with `vendor_type = delegation`.
- Existing `partner` users become `vendor` users with `vendor_type = partner`.
- No account is considered deliverable until its Auth user, app metadata, active database binding, and login flow are all verified.
- Sample accounts belong in non-production environments and must use documented test credentials outside source control.

## 10. Delivery Acceptance Criteria

The three-tier model is ready for delivery only when all conditions pass:

- A Superadmin can view and manage every Admin and Vendor.
- An Admin can manage only Vendors assigned to that Admin tenant.
- A Vendor can access only its own permitted company records.
- No user can promote itself or another user to Superadmin through the client or `user_metadata`.
- Missing or invalid role bindings fail closed at login, route protection, server actions, and RLS.
- Cross-tenant read and write attempts return no data or an authorization error.
- Account suspension prevents access after session refresh/revocation.
- Superadmin, Admin, and Vendor flows have automated authorization tests.
- Supabase security advisors report no security lints before release.
- All privileged changes produce audit events.
- Production has no undocumented shared accounts or credentials committed to the repository.

## 11. Implementation Backlog

The following work must be completed against this specification:

1. Add `superadmin`, `admin`, and `vendor` to the shared role model.
2. Add Admin tenant and Vendor ownership columns/tables to the schema.
3. Migrate legacy delegation/partner access into the unified Vendor role with subtype claims.
4. Add Superadmin route protection and a platform control center.
5. Replace tenant-blind Admin policies with explicit `admin_id` scope checks.
6. Add trusted server-side account provisioning and metadata management.
7. Add audit events for role, tenant, account, and transfer operations.
8. Add unit, integration, and RLS tests for all three layers and negative cross-tenant cases.
9. Provision non-production sample users only after Auth Admin API access is configured.

Until this backlog is complete, the current application must not be described as having a production-ready Superadmin layer; its existing `admin` role is not equivalent to this specification.
