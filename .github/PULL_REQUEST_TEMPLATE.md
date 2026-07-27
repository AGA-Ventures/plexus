## Summary

Describe what changed and why.

## Safety checklist

- [ ] `CHANGELOG.md` has a dated entry for this change.
- [ ] `npm run whereami` shows the expected GitHub and Supabase targets.
- [ ] `npm run verify:release` passes.
- [ ] No `.env.local`, secret key, password, or token is committed.
- [ ] Database changes use a new file in `supabase/migrations/`.
- [ ] If database migrations changed, `npm run supabase:plan` was reviewed.
- [ ] Production deployment is from `main` only.
