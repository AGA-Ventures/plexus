---
version: 1
slug: "components-login-form-tsx"
primary_target: "components/login-form.tsx"
related_targets:
  [
    "app/[locale]/login/page.tsx",
    "app/login/page.tsx",
    "app/login-preview/page.tsx",
  ]
---

# Login portal surface brief

## Scope and mode

- Primary target: `components/login-form.tsx`
- Related routes: `/[locale]/login` and tenant-branded login links
- Mode: Operate

## Audience, job, action, proof, and constraints

Program operators, participating companies, and Plexus platform teams need to identify the correct workspace and sign in without ambiguity. The primary action remains credential submission; password recovery and account support remain immediately available. Tenant name, logo, support email, primary color, multilingual copy, safe errors, preview mode, password-reset confirmation, and existing authorization behavior must remain intact.

## Chosen direction

**The Governed Checkpoint** — binding user reference: `.impeccable/mocks/decision/login-governed-checkpoint-light.png`.

The memorable moment is the hard transition from a dark, brand-led identity rail into a bright three-stage operating canvas. Identity is active, Workspace and Responsible next step remain visibly ordered, and the credential task sits directly in the first lane rather than inside a floating marketing card.

## Implementation inventory

| Visible ingredient  | Recorded treatment                                                                                                                                           | Medium                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| Outer frame         | 6px cool-gray gutter, 1px edge, 9px corner, and restrained page shadow                                                                                       | Semantic HTML/CSS                       |
| Identity rail       | Fixed 326px Midnight rail with the supplied network field, quiet opacity-only twinkling, electric-blue X, exact Plexus or tenant mark, promise, and audience | Existing rasters and semantic HTML/CSS  |
| Stage architecture  | Bright canvas with numbered Identity, Workspace, and Responsible next step lanes; 44% / 34% / 22% desktop split                                              | Semantic HTML/CSS                       |
| Active stage        | Reference-matched `#0668e8` number and 104px underline with cool one-pixel horizontal and vertical rules                                                     | Semantic HTML/CSS                       |
| Credential form     | Unboxed first-lane form with a 29px title, 16–17px copy, and familiar field labels                                                                           | Existing form behavior restyled in CSS  |
| Inputs              | 62px near-white fields, cool one-pixel edge, 7px corners, library icons, and visible focus treatment                                                         | Existing form controls and icon library |
| Primary action      | 62px platform Checkpoint Active or tenant-aware action with 7px corners                                                                                      | Existing button behavior and CSS        |
| Support destination | Inline localized support question and action below a cool hairline                                                                                           | Semantic link                           |
| Mobile adaptation   | Identity rail, three-stage header, form, and support stack in task order without empty desktop lanes                                                         | Responsive CSS                          |
| Motion preference   | The 7.6s network luminance cycle stops at a quiet static level under `prefers-reduced-motion: reduce`                                                        | CSS media query                         |

## Unresolved decisions

None. The comp's spatial idea is binding; text rendered inside the comp is reference-only where localization or live state supplies the production copy.
