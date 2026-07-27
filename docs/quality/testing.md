# Testing Strategy and Current Evidence

**Owner:** Engineering and release owner
**Review trigger:** New workflow, test layer, release evidence, or quality gap
**Last reviewed:** 2026-07-28

## Test layers

| Layer                 | Proves                                              | Command/location                                  |
| --------------------- | --------------------------------------------------- | ------------------------------------------------- |
| Documentation         | Required docs and local links are valid             | `npm run docs:check`                              |
| Static                | Lint and TypeScript contracts                       | `npm run lint`, `npm run typecheck`               |
| Unit                  | Pure auth, matching, export, locale behavior        | `npm run test:unit`                               |
| Database/RLS          | Constraints, isolation, negative access             | `npm run test:rls`                                |
| Browser               | Routes, UI, responsive and credential flows         | `npm run test:e2e`                                |
| Build                 | Production Next.js compilation and route generation | `npm run build`                                   |
| Deployment            | Correct GitHub/Supabase/Vercel targets              | `npm run verify:targets`, `npm run verify:deploy` |
| Production role smoke | Real login, provisioning, route isolation, cleanup  | `scripts/verify-production-roles.mjs`             |

## Standard gates

```bash
npm run docs:check
npm run verify:release
```

`verify:release` checks targets, production dependency audit at critical level,
documentation, lint, types, unit tests, and production build.

When relevant:

```bash
npm run test:rls
npm run test:e2e
```

## Authorization acceptance matrix

| Scenario                             | Expected                         |
| ------------------------------------ | -------------------------------- |
| Unauthenticated protected route      | Redirect to localized login      |
| Password recovery request            | Generic response for valid email |
| Invalid or expired recovery callback | Return to recovery request       |
| Unauthenticated password update      | Reject and request a new link    |
| Superadmin requests Admin recovery   | Active Admin only; audited email |
| Invalid/malformed trusted claims     | Deny and sign out                |
| Inactive profile                     | Deny                             |
| Inactive tenant/Vendor               | Deny                             |
| Superadmin opens Admin/Vendor route  | Redirect to Superadmin workspace |
| Admin reads another tenant           | No data/authorization error      |
| Admin provisions into another tenant | Reject                           |
| Vendor reads another Vendor          | No data                          |
| Vendor opens Admin/Superadmin route  | Redirect to Vendor workspace     |
| Vendor updates another company       | Reject                           |
| Direct authorization-binding update  | Trigger/RLS rejection            |

## Verified production evidence

On 2026-07-27:

- All 19 public business tables had RLS enabled.
- Supabase exposed 70 reviewed policies and zero security-advisor findings.
- All 20 migrations were present in the approved project.
- Lint, TypeScript, 25 unit tests, and the production build passed locally and
  in GitHub CI.
- Public production routes returned expected responses.
- Protected Admin, Superadmin, and Vendor routes redirected anonymous users to
  login.
- The production role verifier logged in as Superadmin, created a temporary
  Admin, logged in as that Admin, created a temporary Vendor, logged in as that
  Vendor, verified desktop/mobile workspace isolation, and removed all
  temporary Auth and database records.
- Vercel production error logs were clean after verification.

## Production role verifier

The verifier intentionally creates and deletes temporary production QA
identities. Run it only with an approved Superadmin and server secret:

```bash
E2E_BASE_URL=https://production.example \
  node --env-file=.env.local scripts/verify-production-roles.mjs
```

The script uses unique `.invalid` emails, verifies cleanup, and fails if any
temporary profile, tenant, Vendor, or Auth user remains.

## Browser and responsive matrix

Before public launch or major UI release, test:

- Current Chrome desktop.
- Current Safari desktop and iOS.
- Current Edge desktop.
- Android Chrome.
- Keyboard-only navigation.
- 390 px mobile, tablet, and desktop widths.
- English, Simplified Chinese, Traditional Chinese, and Thai.
- Loading, empty, validation, permission, network, and server-error states.

## Integration testing requirements

Every production provider adapter must test:

- Valid request and normalized response.
- Authentication/credential failure.
- Timeout and network failure.
- Retry and idempotency behavior.
- Rate limiting.
- Malformed/provider-changed response.
- Tenant and permission isolation.
- Redaction of credentials and sensitive payloads from logs.

## Known gaps

- Authenticated browser tests are credential-gated rather than running in
  normal pull-request CI.
- Provider adapters for meetings, email, signing, notifications, QR, and some
  compliance flows need production integration tests.
- Safari/Edge, accessibility, performance, and Core Web Vitals need recorded
  baselines.
- Error tracking, uptime monitoring, and user-journey telemetry remain roadmap
  work.

These gaps are tracked in the [roadmap](../project-management/roadmap.md).
