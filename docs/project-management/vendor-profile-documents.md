# Feature Plan: Private Vendor Profile Documents

**Status:** Implemented
**Owner:** Product, Engineering, and Security
**Target:** 2026-07-28 Vendor profile release
**Capability/module:** [Vendor onboarding](../architecture/system-overview.md)
**Last updated:** 2026-07-28

## Problem and evidence

The Vendor registration profile displayed an **Upload PDF** control that only
showed a success toast. Vendors could not persist, review, or remove supporting
documents, so the interface overstated product capability and forced documents
outside the tenant workspace.

## Outcome and measures

- Outcome: Vendors manage their own private profile PDFs inside the profile.
- Primary measure: a valid PDF can be uploaded, reviewed after reload, and
  deleted with no residual metadata or object.
- Guardrail measures: zero cross-tenant/company reads or writes; zero public
  object URLs; rejected spoofed, oversized, or non-PDF files.

## Scope

### Included

- PDF-only upload up to 6 MiB.
- Private metadata and Storage objects.
- Own-company list, short-lived review, and confirmed delete.
- Admin/Superadmin read/delete governance at the RLS layer.
- Desktop and mobile loading, empty, upload, success, error, list, and delete
  confirmation states.

### Excluded

- Non-PDF formats, OCR, antivirus/content scanning, versioning, and public
  sharing.
- Admin-facing profile-document management UI.
- Automated retention expiry.

## User journeys

1. Vendor opens **Company profile → Supporting documents**, selects a PDF, and
   sees the validated file in the private library.
2. Vendor chooses **Review** and the server creates a 60-second signed URL.
3. Vendor chooses **Delete**, confirms the destructive action, and the
   application removes both object and metadata.

## Module contract

| Area | Decision |
| ---- | -------- |
| Owner | Product owns behavior; Engineering/Security own operation and policy |
| Routes/APIs | `GET/POST/DELETE /api/vendor/profile-documents`; `GET /api/vendor/profile-documents/[id]/file` |
| Roles and authorization | Active Vendor UI/API; tenant-bounded Admin and global Superadmin read/delete through RLS |
| Tenant/company scope | Exact trusted `admin_id`, `vendor_company_id`, and `vendor_type`; server-created path |
| Tables/migrations | `vendor_profile_documents`; `vendor-profile-documents` bucket; migrations `20260727213342` and `20260727213424` |
| Server/domain interface | Route handlers plus `lib/vendor-profile-documents.ts` validation/path helpers |
| Domain events | None; the synchronous API response is authoritative |
| External providers | Existing Supabase Postgres/Auth/Storage only |
| Failure/retry/idempotency | Unique object path, no upsert; upload rolls back object if metadata insert fails; delete is safely retryable |
| UX states/locales/mobile | Existing portal shell; English operational copy, responsive list/actions, loading/empty/error/success/confirm states |
| Tests | Helper unit tests, Vendor browser flow, API/RLS/storage cases, manual signed-link check |
| Monitoring/support | Vercel API logs and Supabase API/Storage logs; runbook triage |
| Documentation | Product guide, schema, routes, security, testing, runbook, changelog |

## Security and privacy

- Threats: cross-tenant object access, MIME spoofing, oversized uploads, path
  traversal, enumeration, and accidental deletion.
- Personal/sensitive data: business documents may include confidential company
  or contact information; objects are private.
- Retention/export/deletion: retained until Vendor or authorized operator
  deletion; no automatic expiry in this slice.
- Abuse/rate limits: 6 MiB hard limit and one multipart file per request;
  application-level rate limiting remains release-hardening work.
- Audit requirements: Vendor operations are not privileged lifecycle changes;
  Admin/Superadmin management UI would require audit coverage when added.

## Delivery slices

| Slice | Outcome | Dependencies | Acceptance |
| ----- | ------- | ------------ | ---------- |
| 1 | Private schema and bucket | Existing trusted claims and active-actor function | RLS and Storage advisors show no new security warning |
| 2 | Protected APIs and UI | Slice 1 | Upload, reload/list, review, confirm/delete all work |
| 3 | Verification and operations | Slices 1–2 | Unit/release checks, browser proof, docs, and cleanup pass |

## Acceptance criteria

- [x] Placeholder toast is removed.
- [x] PDF extension, MIME, size, and signature are checked server-side.
- [x] Browser never receives a private Storage path.
- [x] Metadata and object access are tenant/company scoped.
- [x] Review uses a short-lived signed URL.
- [x] Delete requires confirmation and removes object plus metadata.
- [x] Unit, browser, RLS, documentation, and release coverage is recorded.

## Rollout and rollback

- Preview/staging: verify with a run-tagged PDF and delete it after review.
- Feature control: no separate flag; route authorization fails closed.
- Migration order: metadata/bucket/policies, then covering indexes, then app.
- Production smoke: Vendor upload → reload/list → review → delete; confirm no
  row or object remains.
- Rollback/forward fix: disable the UI/API through an application rollback;
  preserve the table/bucket and use a reviewed forward migration for schema
  repair to avoid document loss.

## Open decisions

- Approve retention duration, malware scanning, and Admin management UI before
  broader external document intake.
