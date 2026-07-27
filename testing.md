# MalayConnect MVP Phase One Testing

Review date: 2026-07-27

## Three-Tier Authorization Verification

The `business.md` authorization model is implemented with the canonical roles
`superadmin`, `admin`, and `vendor`. Delegation and Partner are Vendor subtypes,
not additional authorization roles.

Production verification completed on 2026-07-27:

- Public signup is disabled; a direct signup attempt is rejected by Supabase
  Auth.
- The shared `/[locale]/login` page routes each valid account to
  `/superadmin`, `/admin`, or `/vendor` from trusted `app_metadata`.
- All 19 exposed business tables have RLS enabled and no `anon` table grants.
- The Supabase security advisor reports zero findings.
- All 16 transactional pgTAP assertions pass, including Admin tenant isolation,
  Vendor company isolation, malformed-claim denial, Superadmin visibility,
  audited Vendor transfer, append-only audit history, stale-token suspension,
  and protection against direct authorization-binding changes.
- `npm run lint`, `npm run typecheck`, `npm run test:unit`, and
  `npm run build` pass. The unit suite contains 25 passing tests.
- The desktop Chrome and Pixel 7 Playwright projects pass all public-route,
  responsive login, overflow, and live Superadmin checks: 22 passed and 12
  credential-dependent Admin/Vendor checks skipped.
- A real signed-in Admin session was verified against `/en/admin` and
  `/en/admin/vendors`, including the tenant-scoped Vendor provisioning dialog.
- The Admin phone layout uses a compact toolbar and drawer; management tables
  switch to mobile record cards.

The remaining release acceptance action is to provision the first real Vendor
account and run the committed Vendor credential tests with
`E2E_VENDOR_EMAIL` and `E2E_VENDOR_PASSWORD`. Do not add shared or undocumented
sample accounts to production.

## Executive Status

The MVP uses Supabase Auth, trusted server-side provisioning, strict database
bindings, and RLS for its three-level authorization model. The authorization
and mobile-navigation work is ready for controlled phase-one delivery. Public
release still requires a real Vendor credential test and the non-authorization
integration checks listed below.

The canonical role routes all build and respond from the production server:

| Route | Status | Notes |
| --- | --- | --- |
| `/en/superadmin` | Pass | Platform-wide tenant, Vendor, account, reporting, settings, and audit console. |
| `/en/admin` | Pass | Tenant-scoped Admin operations portal. |
| `/en/admin/vendors` | Pass | Tenant-scoped Vendor and account management. |
| `/en/vendor` | Pass | Unified Vendor portal for Delegation and Partner subtypes. |

The localized Chinese routes also respond, and `/cn/...` is accepted as a
Chinese alias. Legacy Delegation and Partner routes resolve through the unified
Vendor authorization flow.

## Tests Run

```bash
npm run lint
npm run typecheck
npm run build
npm run start -- -p 3001
```

Production smoke test was run with Node `fetch` because `curl` is not available in this shell:

```bash
node - <<'NODE'
const paths = [
  '/',
  '/login',
  '/admin',
  '/delegation',
  '/partner',
  '/en/admin',
  '/en/delegation',
  '/en/partner',
  '/zh/admin',
  '/cn/admin',
  '/bad/admin',
];

for (const path of paths) {
  const res = await fetch(`http://localhost:3001${path}`, { redirect: 'manual' });
  console.log(`${path.padEnd(18)} ${res.status} ${res.headers.get('location') ?? ''}`);
}
NODE
```

Observed result:

```txt
/                  200
/login             307 /en/login
/admin             307 /en/admin
/delegation        307 /en/delegation
/partner           307 /en/partner
/en/admin          200
/en/delegation     200
/en/partner        200
/zh/admin          200
/cn/admin          200
/bad/admin         404
```

## Production-Level Gaps

These items block a true production launch:

1. A real Vendor account has not yet completed credentialed browser acceptance.
   Provision it from the Admin or Superadmin console, then run the committed
   Vendor E2E checks. Self-signup remains intentionally disabled.

2. Operational integrations are incomplete.
   Core portal data is persisted in Supabase, but meeting, email, QR, document, notification, and audit workflows still need production integrations.

3. Operational workflows need broader business-rule and audit coverage.
   Privileged tenant, Vendor, account, transfer, and platform-setting changes
   are audited. Matching, attendance, meeting, and deal workflow coverage still
   needs release sign-off.

4. Meeting, email, QR, document, and notification flows are mocked.
   Links, MOU documents, notifications, and QR codes are demo placeholders, not integrated with production services.

5. Edge and privacy controls still need release sign-off.
   Confirm CSP/security headers, rate limits, deployment secret management,
   retention, and the contact-data privacy review.

6. Error and empty-state coverage is not production complete.
   The app relies on framework defaults for 404/error handling and needs custom `not-found`, `error`, and `global-error` coverage.

7. Complete the remaining cross-browser and quality checks.
   Test current Safari and Edge and record Lighthouse or equivalent results.

7. Test automation is credential-gated.
   A Playwright suite is committed, but there is no CI test gate and authenticated coverage requires Supabase credentials.

8. Observability is missing.
   Add production analytics, error reporting, uptime monitoring, and Core Web Vitals reporting.

9. SEO and deployment assets are minimal.
    Metadata exists, but production should add finalized titles/descriptions, icons, robots/sitemap policy, preview images, and canonical locale behavior.

## What Must Be Done Today For Go-Live

Minimum realistic path for a controlled MVP go-live today:

1. Decide launch mode.
   If this is a private stakeholder demo, keep it as a controlled MVP. If this is public production, do not launch until the remaining integrations, audit logging, and deployment security controls are done.

2. Verify Supabase access before sharing the URL.
   Confirm the migrations are applied, email confirmation is configured, and admin/delegation/partner credentials use the required `app_metadata` bindings.

3. Replace or clearly label mocked integrations.
   Confirm with stakeholders which meeting, notification, document, QR, and compliance flows are still demo placeholders.

4. Run final production checks.
   Run `npm run lint`, `npm run typecheck`, `npm run build`, start the production server, and smoke-test `/en/admin`, `/en/delegation`, `/en/partner`, `/zh/admin`, `/zh/delegation`, and `/zh/partner`.

5. Perform manual acceptance testing.
   Test login, route redirects, role navigation, company CRUD, matching, meeting scheduling, MOU status update, attendance confirmation, itinerary publishing, and mobile layout.

6. Deploy to a staging/preview URL first.
   Verify the same smoke tests on the deployed URL before pointing any live domain to it.

7. Capture sign-off.
   Record known limitations, supported demo workflows, and the decision that this is phase-one MVP demo scope.

## Manual Test Checklist

### Login

- Open `/en/login`.
- Submit an invalid email/password; expect an error message.
- Submit the Supabase admin credentials; expect redirect to `/en/admin`.
- Submit the delegation credentials; expect redirect to `/en/delegation`.
- Submit the partner credentials; expect redirect to `/en/partner`.
- Repeat `/zh/login` for Chinese copy.

### Admin Portal

- Open `/en/admin`.
- Verify dashboard metrics render.
- Search companies.
- Add, edit, view, and delete a delegation company.
- Add, edit, view, and delete a partner company.
- Create a match and verify duplicate match prevention.
- Schedule a session and confirm it appears in meetings.
- Complete a meeting and verify reporting counters update.
- Update MOU/deal status.
- Confirm partner check-in.
- Toggle itinerary publish status.

### Delegation Portal

- Open `/en/delegation`.
- Verify the account is linked to the expected delegation company.
- Verify profile, matches, meetings, MOU, and itinerary content.
- Accept or reject a proposed match.
- Save profile readiness.
- Join-link buttons should open external meeting URLs in a new tab.

### Partner Portal

- Open `/en/partner`.
- Verify the account is linked to the expected partner company.
- Verify profile, matches, meetings, MOU, attendance, and on-site content.
- Accept or reject a match.
- Confirm attendance and verify QR status updates.
- Save profile readiness.

### Routing

- `/admin` redirects to `/en/admin`.
- `/delegation` redirects to `/en/delegation`.
- `/partner` redirects to `/en/partner`.
- `/login` redirects to `/en/login`.
- `/zh/admin`, `/zh/delegation`, and `/zh/partner` load.
- `/cn/admin` loads as Chinese alias.
- Invalid locale path such as `/bad/admin` returns 404.

### Responsive and Browser Checks

- Test at desktop, tablet, and mobile widths.
- Confirm no text overlap in tab bars, buttons, cards, dialogs, or tables.
- Test latest Chrome, Safari, and Edge.
- Run Lighthouse or equivalent for performance, accessibility, best practices, and SEO before public launch.

## Recommended Automated Test Setup

Run the committed Playwright suite before production release:

```bash
npm run build
npm run start
npx playwright test
```

Recommended E2E coverage:

- Route availability and redirects.
- Login happy path and invalid credentials.
- Admin company CRUD.
- Admin match creation and duplicate prevention.
- Meeting scheduling and completion.
- Delegation match acceptance/rejection.
- Partner attendance confirmation.
- Mobile viewport smoke test for all three portal routes.

## Current Decision

Ship only as a controlled phase-one MVP. The three-tier authorization and mobile
Admin navigation are verified. Do not treat it as a public release until the
real Vendor credential test, operational integrations, cross-browser checks,
and deployment/privacy controls are signed off.
