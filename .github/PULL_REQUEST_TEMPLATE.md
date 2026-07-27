## Summary

Describe what changed and why.

## Impact

- User/product:
- Authorization/data:
- Operations/deployment:

## Safety checklist

- [ ] `CHANGELOG.md` has a dated entry for this change.
- [ ] `npm run whereami` shows the expected GitHub and Supabase targets.
- [ ] `npm run docs:check` passes and affected canonical docs are updated.
- [ ] `npm run verify:release` passes.
- [ ] No `.env.local`, secret key, password, or token is committed.
- [ ] Database changes use a new file in `supabase/migrations/`.
- [ ] Database changes update `docs/architecture/database-schema.md`.
- [ ] Authorization changes include negative cross-tenant tests.
- [ ] If database migrations changed, `npm run supabase:plan` was reviewed.
- [ ] Provider changes define timeout, retry, idempotency, and failure behavior.
- [ ] Production deployment is from `main` only.
