# Glossary

**Owner:** Product and engineering
**Review trigger:** New domain term or changed meaning
**Last reviewed:** 2026-08-26

| Term             | Meaning                                                                                |
| ---------------- | -------------------------------------------------------------------------------------- |
| Admin            | Tenant-scoped operator; not the Plexus platform owner                                  |
| Admin tenant     | Isolated operating organization represented by `admin_tenants`                         |
| App metadata     | Supabase Auth server-controlled claims used for authorization                          |
| Audit event      | Append-only record of a privileged change                                              |
| Business Participant | Participating company actor represented by the current technical `vendor` authorization role |
| Capability       | A user/business outcome delivered by one or more modules                               |
| Controlled       | Live capability with a disclosed manual operational step                               |
| Delegation       | Business Participant subtype representing a visiting/participating company             |
| Local Service Partner | Admin-coordinated provider of assigned interpretation, travel, transportation, venue, accommodation, or logistics services; not an authorization role today |
| Module           | Owned product/technical boundary with routes, data, permissions, tests, and operations |
| Organizer        | Product label for the tenant-scoped Admin operating a program                          |
| Partner          | Business Participant subtype representing a host/matching organization                 |
| Publishable key  | Browser-visible Supabase API key; RLS remains the boundary                             |
| RLS              | PostgreSQL Row Level Security                                                          |
| Secret key       | Server-only Supabase key used for privileged Admin API operations                      |
| Superadmin       | Plexus platform operator with cross-tenant authority                                   |
| Superapp         | One modular platform hosting multiple connected business capabilities                  |
| Tenant isolation | Guarantee that an Admin/Vendor cannot access another tenant's private data             |
| User metadata    | User-editable/display metadata; never an authorization source                          |
| Vendor           | Current technical authorization and schema term for a Business Participant; not a Local Service Partner |
| Vendor company   | Current technical company identity represented by `vendor_companies`                   |
| Vertical slice   | One change that delivers behavior, data, auth, tests, docs, and operations together    |
