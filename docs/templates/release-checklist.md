# Release Checklist: <Release>

**Release owner:** <name/role>
**Target date:** YYYY-MM-DD
**Commit:** <sha>
**Environment:** Preview / Production

## Scope and approval

- [ ] Included changes and known exclusions are listed.
- [ ] Product/security/data approvals are recorded where required.
- [ ] `CHANGELOG.md` is updated.

## Verification

- [ ] `npm run docs:check`
- [ ] `npm run verify:release`
- [ ] Relevant `npm run test:rls`
- [ ] Relevant `npm run test:e2e`
- [ ] CI passes.
- [ ] Preview is reviewed.

## Data and environment

- [ ] Migration plan is reviewed.
- [ ] Backup/recovery posture is confirmed for risky data changes.
- [ ] Environment variables exist in correct scopes.
- [ ] No secret or production data is committed.

## Deployment

- [ ] Exact commit is pushed to approved GitHub repository.
- [ ] Required migrations are applied in compatible order.
- [ ] Application is deployed from reviewed `main`.
- [ ] Deployment reports Ready.

## Production verification

- [ ] Home and login respond.
- [ ] Protected routes redirect unauthenticated users.
- [ ] Affected role journeys pass.
- [ ] Temporary QA data is removed.
- [ ] Vercel and Supabase errors are reviewed.
- [ ] Monitoring/alerting is healthy.

## Rollback

- Previous deployment:
- App rollback:
- Database forward fix:
- Decision owner:

## Result

- Status:
- Production URL:
- Follow-up items:
