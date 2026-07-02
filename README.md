# Plexus Connect

Supabase-backed MVP for the Plexus Connect Malaysia-China/Macao business matching platform.

## Routes

- `/login`, `/en/login`, `/zh/login` - Supabase Auth login.
- `/en/admin` and `/zh/admin` - AGA admin portal for companies, matching, meetings, signing, on-site operations and reports.
- `/en/delegation` and `/zh/delegation` - Chinese/Macao delegation company portal.
- `/en/partner` and `/zh/partner` - Malaysian partner portal.

`/cn/...` is accepted as a Chinese alias. Unprefixed routes redirect to the English portal equivalents.

## Supabase launch mode

The app is configured for the `plexus-production` Supabase project:

```txt
https://rlstdzocgxsalvzayfir.supabase.co
```

Copy `.env.example` to `.env.local` for local development. Only the Supabase URL and publishable key are used in app code.

Schema, RLS policies, explicit Data API grants and starter seed data live in:

```txt
supabase/migrations/20260624000000_plexus_production_launch.sql
```

## Auth users

Phase one does not allow self-signup. Create users in the Supabase Dashboard and set `app_metadata`.

Admin:

```json
{ "role": "admin" }
```

Delegation:

```json
{
  "role": "delegation",
  "delegation_company_id": "00000000-0000-4000-8000-000000000001"
}
```

Partner:

```json
{
  "role": "partner",
  "partner_company_id": "00000000-0000-4000-8000-000000001001"
}
```

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```
