# MalayConnect MVP Phase One Testing

Review date: 2026-06-24

## Executive Status

The MVP is demo-ready for phase-one stakeholder review, but it is not production-level yet.

The three core MVP routes all build and respond from the production server:

| Route | Status | Notes |
| --- | --- | --- |
| `/en/admin` | Pass | Admin portal loads from production build. |
| `/en/delegation` | Pass | Delegation portal loads from production build. |
| `/en/partner` | Pass | Partner portal loads from production build. |

The localized Chinese routes also respond, and `/cn/...` is accepted as a Chinese alias. Unprefixed routes such as `/admin`, `/delegation`, and `/partner` redirect to their English equivalents.

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

1. Authentication is demo-only.
   The shared passcode is public in the UI and stored in client code. Portal routes are directly accessible without a verified server session.

2. Authorization is not enforced.
   Users can switch between Admin, Delegation, and Partner routes from the UI. Production needs server-side role checks and tenant/company scoping.

3. Data persistence is browser-local only.
   Operational data is stored in `localStorage`, so data is per browser, not shared, auditable, recoverable, or backed up.

4. Forms do not have production validation.
   Company, matching, attendance, meeting, and deal updates need server-side validation, schema checks, audit logs, and permission checks.

5. Meeting, email, QR, document, and notification flows are mocked.
   Links, MOU documents, notifications, and QR codes are demo placeholders, not integrated with production services.

6. Security hardening is incomplete.
   Add CSP/security headers, rate limits, session expiry, secret management, CSRF-safe mutation paths, and a privacy review for contact data.

7. Error and empty-state coverage is not production complete.
   The app relies on framework defaults for 404/error handling and needs custom `not-found`, `error`, and `global-error` coverage.

8. Test automation is missing.
   There is no committed Playwright/Cypress E2E suite, no CI test gate, and no accessibility or visual regression checks.

9. Observability is missing.
   Add production analytics, error reporting, uptime monitoring, and Core Web Vitals reporting.

10. SEO and deployment assets are minimal.
    Metadata exists, but production should add finalized titles/descriptions, icons, robots/sitemap policy, preview images, and canonical locale behavior.

## What Must Be Done Today For Go-Live

Minimum realistic path for a controlled MVP go-live today:

1. Decide launch mode.
   If this is a private stakeholder demo, keep it as MVP demo and restrict access at the deployment level. If this is public production, do not launch until authentication, authorization, and database persistence are done.

2. Add access protection before sharing the URL.
   Use platform password protection, private deployment, basic auth, or managed auth. Do not rely on the visible `demo2026` passcode.

3. Replace or clearly label demo data behavior.
   Confirm with stakeholders that all changes are browser-local and can be reset. For any real user data, move storage to a production database first.

4. Run final production checks.
   Run `npm run lint`, `npm run typecheck`, `npm run build`, start the production server, and smoke-test `/en/admin`, `/en/delegation`, `/en/partner`, `/zh/admin`, `/zh/delegation`, and `/zh/partner`.

5. Perform manual acceptance testing.
   Test login, route redirects, role navigation, company CRUD, matching, meeting scheduling, MOU status update, attendance confirmation, itinerary publishing, LocalDB reset, and mobile layout.

6. Deploy to a staging/preview URL first.
   Verify the same smoke tests on the deployed URL before pointing any live domain to it.

7. Capture sign-off.
   Record known limitations, supported demo workflows, and the decision that this is phase-one MVP demo scope.

## Manual Test Checklist

### Login

- Open `/en/login`.
- Select Admin and submit with an incorrect passcode; expect an error toast.
- Submit with `demo2026`; expect redirect to `/en/admin`.
- Repeat for Delegation and Partner accounts.
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
- Reset LocalDB and confirm seed data returns.

### Delegation Portal

- Open `/en/delegation`.
- Switch selected delegation company.
- Verify profile, matches, meetings, MOU, and itinerary content.
- Accept or reject a proposed match.
- Save profile readiness.
- Join-link buttons should open external meeting URLs in a new tab.

### Partner Portal

- Open `/en/partner`.
- Switch selected partner company.
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

Add Playwright before production release:

```bash
npm init playwright
npm run build
npm run start
npx playwright test
```

Recommended E2E coverage:

- Route availability and redirects.
- Login happy path and invalid passcode.
- Admin company CRUD.
- Admin match creation and duplicate prevention.
- Meeting scheduling and completion.
- Delegation match acceptance/rejection.
- Partner attendance confirmation.
- LocalDB reset.
- Mobile viewport smoke test for all three portal routes.

## Current Decision

Ship today only as a controlled private MVP demo. Do not treat this as public production until real auth, role-based authorization, shared persistent storage, production integrations, automated E2E tests, and deployment security controls are in place.
