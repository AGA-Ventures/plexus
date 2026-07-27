<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Plexus repository rules

1. Read `docs/README.md` before changing the application.
2. Run `npm run whereami` before development or deployment.
3. Keep business behavior, routes, database schema, tests, and documentation in
   the same change.
4. Add a dated `CHANGELOG.md` entry for every meaningful change.
5. Database changes require a new migration in `supabase/migrations/` and a
   matching update to `docs/architecture/database-schema.md`.
6. New product modules must follow the module contract in
   `docs/architecture/system-overview.md`.
7. Never commit credentials, `.env.local`, Vercel state, production data, or
   Supabase secret/service-role keys.
8. Run `npm run docs:check` and `npm run verify:release` before handoff.
9. Preserve active uncommitted work that is outside the requested scope.
