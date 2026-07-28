# Feature Plan: Admin MOU Documents

**Status:** Implemented
**Owner:** Product, Engineering, and Security
**Target:** 2026-07-28 Signing release
**Capability/module:** [Signing/MOU](../architecture/system-overview.md)
**Last updated:** 2026-07-28

## Problem and outcome

The Admin Signing screen could list seeded deal names and mark a deal Signed,
but it could not create an agreement or persist a real draft/signed PDF.
Admins can now create an MOU from an existing tenant-scoped Vendor match,
manage its status, upload or replace one private PDF, review it, and remove the
PDF without deleting the agreement.

## Module contract

| Area | Decision |
| ---- | -------- |
| Owner | Product owns signing behavior; Engineering/Security own storage and authorization |
| Routes/APIs | `POST/DELETE /api/admin/deals/[id]/document`; `GET /api/mou-documents/[id]/file` |
| Roles and authorization | Active owning Admin creates/writes; active participating Vendors read; Superadmin retains database governance |
| Tenant scope | Trusted `admin_id`; Vendor read requires participation through `deals → matches` |
| Tables/migrations | `mou_documents`; `mou-documents` bucket; migrations `20260727233500`, `20260727234027`, `20260727234448`, and `20260727234616` |
| Server interface | `createDealAction`, `updateDealAction`, protected route handlers, `lib/mou-documents.ts` |
| Events/audit | Deal and MOU metadata inserts, updates, and deletes write `audit_events` |
| External providers | Existing Supabase Postgres/Auth/Storage only |
| Failure/retry | New object first on replacement; metadata failure removes it; obsolete-object cleanup is logged |
| UX | Create, empty, upload, replace, review, status, confirm-delete, loading, and error states |
| Quality | Helper unit tests, Admin browser flow, API/RLS/Storage cases, release verification |
| Operations | Vercel route logs, Supabase database/Storage logs, runbook triage |

## Security and privacy

- PDF only, maximum 10 MiB, with extension, declared MIME, and `%PDF-`
  signature checks.
- Server-generated sanitized path; no private path returned to the browser.
- One metadata record per deal and a private Storage bucket.
- Review is an authenticated 60-second signed redirect with no-referrer and
  no-store headers.
- Admin writes are limited to the own tenant; Vendor reads require exact match
  participation.
- Deleting a PDF preserves the commercial agreement and its status history.

## Acceptance criteria

- [x] Admin can create an MOU from an unmatched agreement candidate.
- [x] Duplicate UI creation for a match is prevented.
- [x] Valid draft/signed PDF upload survives reload.
- [x] Replacement removes the superseded object after metadata succeeds.
- [x] Review uses a short-lived signed URL.
- [x] Delete requires confirmation and retains the deal.
- [x] RLS, Storage policies, audit triggers, indexes, docs, and tests ship
  together.

## Rollout and rollback

Apply the metadata/bucket/policy migration before the application build, then
the covering-index and atomic deal-label synchronization migrations. Smoke
test with a disposable own-tenant deal and PDF, review from Admin and a
participating Vendor, replace, then delete the file. Roll back the application
through Vercel if necessary, but preserve the table and bucket and use a
reviewed forward migration for schema repair to avoid document loss.
