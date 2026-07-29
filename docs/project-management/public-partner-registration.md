# Public Malaysian Partner Registration

Status: implemented for local validation
Source: SBS meeting recordings, Parts 1 and 2
Agreed delivery dates below are meeting commitments and should be reconfirmed
before production release.

## Section 7 — Public Registration Form Clarification

The public form is the intake and qualification step, not a Vendor account
signup. Malaysian companies open one tenant-specific link, submit a short
profile without authentication, and see a confirmation message. The Admin
reviews the submission before any login account is provisioned.

| Flow | Side A — Macao delegates | Side B — Malaysian companies |
| --- | --- | --- |
| Source | Confirmed delegate list and company data supplied to AGA | Associations distribute one public registration link to their members |
| Data entry owner | AGA keys the company into Plexus | Each Malaysian company self-registers |
| Authentication at intake | AGA uses its authenticated Admin workspace | None; the route is public |
| Initial status | Managed directly as a delegation record | Pending qualification |
| Account timing | Provisioned by AGA when the delegate is ready | Provisioned only after Admin approval |
| Matching eligibility | Controlled by delegation readiness | Only approved companies should be used for matching |

### Public form fields

The light intake contains 11 business fields. Malaysia and the Enterprise
partner type are fixed by the workflow and are not presented as questions.
The company logo is an additional optional file upload.

1. Company name — required, 2–240 characters.
2. SSM / registration number — required, 2–120 characters.
3. Website — optional, complete HTTP or HTTPS URL.
4. Industry sector — required, selected from the Plexus ISIC sector picker.
5. Company profile — required, 100–200 words.
6. Products and services — required, 20–3,000 characters.
7. What the company is looking for — required, 20–2,000 characters.
8. Contact name — required, 2–160 characters.
9. Position / title — required, 2–160 characters.
10. Business email — required, valid email.
11. Mobile number — required, valid phone with an optional country code.

The optional logo accepts JPG, PNG, or WebP up to 2 MB. A successful submission
stays on the form and confirms that qualification is pending; it never redirects
the applicant to an authenticated dashboard.

### Action items

| # | Action | Owner | Meeting deadline |
| --- | --- | --- | --- |
| 1 | Confirm the light registration fields and qualification criteria | SBS + AGA | 29 Jul, 1:00 pm |
| 2 | Produce the working public-form sample | Plexus delivery team | 31 Jul |
| 3 | Test form validation, mobile layout, tenant routing, and Admin review | AGA QA | 31 Jul |
| 4 | Put the approved registration link online | Plexus delivery team | 1 Aug, 3:00 pm |
| 5 | Distribute the final link to Malaysian associations and monitor submissions daily | SBS / association coordinators, monitored by AGA | 3 Aug |

## Section 8 — Codex Build Prompt

Build a tenant-specific public Malaysian partner registration flow in Plexus.
Expose `/{locale}/register?tenant={tenant-slug}` and `/register` (English
forwarder) without an authentication guard. Validate the 11 fields listed in
Section 7 on both the browser and server. Accept an optional JPG, PNG, or WebP
logo up to 2 MB and upload it to Supabase Storage. Insert the registration into
the tenant's `partner_companies` directory with `verified = Pending`,
`status = Invited`, a structured `profile_data` payload, and no user account.
Return a success message in place and never redirect to a dashboard.

In the Admin workspace, replace **Add MY Partner** with a tenant-specific
**Public registration form** link. Show a pending-registration counter on the
dashboard and Malaysian partners summary, provide **Partner directory** and
**Pending approvals** tabs, and allow an Admin to approve or reject pending
companies. Approval sets the company to `Verified` / `Sourced`; rejection sets
it to `Flagged` / `Declined`. Account creation remains the post-qualification
provisioning step.

Match the current dark Plexus visual system, tenant logo and primary color,
responsive field grids, industry-sector picker, accessible error states, and
mobile layout.

Build order:

1. Define and unit-test the public registration schema.
2. Add the public localized route and validate tenant branding.
3. Build the responsive 11-field form with an optional logo input.
4. Add the server action, duplicate guard, tenant resolution, and Storage upload.
5. Insert a pending tenant-scoped partner and audit the public submission.
6. Replace the Admin creation control and add pending counters and review tabs.
7. Add approve/reject behavior without issuing an account automatically.
8. Run documentation checks, release verification, and an end-to-end local
   browser test before publishing the existing development branch.
