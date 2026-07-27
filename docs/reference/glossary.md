# Glossary

**Owner:** Product and engineering
**Review trigger:** New domain term or changed meaning
**Last reviewed:** 2026-07-27

| Term             | Meaning                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| Admin            | Tenant-scoped operator; not the Plexus platform owner                                  |
| Admin tenant     | Isolated operating organization represented by `admin_tenants`                         |
| App metadata     | Supabase Auth server-controlled claims used for authorization                          |
| Audit event      | Append-only record of a privileged change                                              |
| Capability       | A user/business outcome delivered by one or more modules                               |
| Controlled       | Live capability with a disclosed manual operational step                               |
| Delegation       | Vendor subtype representing a visiting/participating company                           |
| Module           | Owned product/technical boundary with routes, data, permissions, tests, and operations |
| Partner          | Vendor subtype representing a host/matching organization                               |
| Publishable key  | Browser-visible Supabase API key; RLS remains the boundary                             |
| RLS              | PostgreSQL Row Level Security                                                          |
| Secret key       | Server-only Supabase key used for privileged Admin API operations                      |
| Superadmin       | Plexus platform operator with cross-tenant authority                                   |
| Superapp         | One modular platform hosting multiple connected business capabilities                  |
| Tenant isolation | Guarantee that an Admin/Vendor cannot access another tenant's private data             |
| User metadata    | User-editable/display metadata; never an authorization source                          |
| Vendor           | End-user company role; subtype is Delegation or Partner                                |
| Vendor company   | Canonical company identity represented by `vendor_companies`                           |
| Vertical slice   | One change that delivers behavior, data, auth, tests, docs, and operations together    |
