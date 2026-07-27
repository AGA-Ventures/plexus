# Supabase Development

The approved hosted project is `Plexus` (`pnjblggcdigekluualin`). Committed
migrations are the database source of truth.

## Start

```bash
npm run supabase:login
npm run supabase:link
npm run verify:targets
```

## Change the schema

```bash
npx supabase migration new short_description
npm run test:rls
npm run supabase:plan
```

Update the [database schema](../docs/architecture/database-schema.md), security
documentation, tests, and `CHANGELOG.md` in the same pull request.

After review:

```bash
npm run supabase:push
```

Applied migrations are immutable. Use a reviewed forward-fix migration instead
of rewriting history.

## Security requirements

- Enable RLS on every table in an exposed schema.
- Add explicit ownership predicates; `TO authenticated` alone is insufficient.
- Updates require both `USING` and `WITH CHECK`.
- Use trusted `app_metadata`, never `user_metadata`, for authorization.
- Keep privileged helpers in an unexposed schema and restrict execution.
- Run security/performance advisors after DDL changes.

See [Authorization and data security](../docs/security/authorization-and-data-security.md)
and [Testing strategy](../docs/quality/testing.md).
