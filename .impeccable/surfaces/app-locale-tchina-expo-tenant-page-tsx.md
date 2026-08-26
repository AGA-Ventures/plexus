# TChina Expo public registration

- **Scope and mode:** One bilingual public Operate surface at `app/[locale]/tchina-expo/[tenantSlug]/page.tsx`; one questionnaire with Business Delegate and General Visitor branches.
- **Audience and job:** Prospective Guangzhou expo attendees choose their path, provide only necessary event/business details, review their answers, and submit for organizer review without mistaking submission for entry confirmation.
- **Approved direction:** `.impeccable/mocks/tchina-expo/01-two-path-agenda.png`. Preserve the 38/62 saturated-blue briefing and mineral-paper questionnaire split, the unmistakable two-path first action, and four-stage progress. Do not literalize its invented daily agenda, ID wording, or unsupported claims.
- **Responsive behavior:** Desktop keeps a sticky briefing rail; mobile becomes one midnight event summary followed immediately by stacked path controls and a vertical form. Same state, copy, validation, and action order at every width.
- **Constraints:** English and Simplified Chinese, tenant identity, organizer approval language, keyboard-visible focus, reduced motion, no QR/passport/visa/PDF/upload, and no automated chat action.

## Fidelity inventory

| Ingredient | Record | Medium |
| --- | --- | --- |
| Ground | Mineral paper `#f7f7f2`; near-white fields | Semantic HTML/CSS |
| Event field | Filled Surface Blue `#0758c8`, roughly 38% desktop width | Semantic HTML/CSS |
| Header | Midnight `#071326`, 68px, exact Plexus wordmark | Existing asset + HTML/CSS |
| Path decision | Two unequal task choices; Delegate primary, Visitor secondary | Accessible buttons + icon library |
| Progress | Four explicit stages with text and Connection Blue active state | Semantic ordered list |
| Form | Restrained 12–16px corners, one-pixel hairlines, no floating collage | Existing form primitives |
| Primary action | Filled Surface Blue with direct action label | Existing button primitive |
| Motion | One path-selection reveal; already visible defaults and reduced-motion parity | CSS transition |

No shipping raster is required by the page; the approved comp remains review evidence only.

## Finish evidence

- Desktop: `.impeccable/review/tchina-desktop.png`
- Mobile: `.impeccable/review/tchina-mobile.png`
- Comp-size reproduction: `.impeccable/review/tchina-hero-repro.png`
- Degraded in-thread finish review (subagents disabled): `ship` after the fix
  verdict resolved progress order, path icon/action fidelity, next-field proof,
  kicker removal, and icon-library consistency.
