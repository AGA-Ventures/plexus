---
target: all the login portal sign in page before code edit
total_score: 23
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
timestamp: 2026-08-25T19-30-26Z
slug: components-login-form-tsx
---
# Login Portal Design Critique

### Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Loading, success, and error states exist, but password-reset success is announced twice. |
| 2 | Match System / Real World | 2 | Core copy is clear; authorization failures can expose internal binding terminology. |
| 3 | User Control and Freedom | 2 | Recovery exists, but there is no locale switch, tenant-correction path, home escape, or useful platform-support action. |
| 4 | Consistency and Standards | 2 | Strong visual consistency, weakened by “Sign in”/“Login,” English-only error/ARIA strings, and competing toast/inline patterns. |
| 5 | Error Prevention | 3 | Native constraints and trusted server routing are sound; “Remember me” makes a promise the action does not honor. |
| 6 | Recognition Rather Than Recall | 3 | Labels and actions are visible; wrong-workspace recovery still depends on outside knowledge. |
| 7 | Flexibility and Efficiency | 2 | Autocomplete and Enter submission work; multilingual users cannot switch language in place. |
| 8 | Aesthetic and Minimalist Design | 3 | Desktop is restrained and coherent; mobile gives the brand narrative more weight than the sign-in task. |
| 9 | Error Recovery | 2 | Inputs survive errors, but technical/nonlocalized failures lack an actionable recovery path. |
| 10 | Help and Documentation | 1 | Platform users are told to contact an unspecified workspace administrator—even when they are the administrator. |
| **Total** |  | **23/40** | **Acceptable; significant trust and recovery work remains.** |

All ten heuristics apply because this is an Operate, form-heavy surface.

### Design Specificity Verdict

**Moderately authored: 3/5.** The network-X artwork, exact Plexus wordmark, Midnight/Connection Blue palette, glass material, and “governed workspace” language make the outer shell unmistakably Plexus. The form itself remains a category-standard dark SaaS login card that could become fintech or cybersecurity UI by changing the logo and copy. Its most product-specific idea—the single role-directed, multilingual, multi-tenant gateway—is architecturally correct but not clearly expressed in the recovery experience.

The deterministic scan found **2 advisory findings across 1 rule**, both in `components/login-form.tsx`: `2.7rem` at line 278 and `1.65rem` at line 295 sit outside exact named `DESIGN.md` font-size steps. The first is arguably a false positive because it falls inside the documented headline range; the second is a genuine token drift. The detector did not find structural blockers, reinforcing that the major concerns are behavioral, accessibility, and trust problems rather than generic visual-style violations.

No reliable visual overlay is available. Mutable script injection failed because the browser surface is read-only, so the evidence pass used fresh desktop/mobile screenshots, DOM snapshots, console logs, and measured layout geometry instead.

### Overall Impression

The page earns trust on arrival but spends too little of that craft on failure and recovery—the moments when authentication trust is actually tested. Desktop composition is strong. On mobile, the marketing narrative outranks the task, and the lowest-confidence states are also the least localized and least actionable.

### What’s Working

1. **A coherent Plexus visual world.** The bespoke background, exact mark, scoped auth glass, Midnight foundation, and large Connection Blue action closely follow the governed-blue design contract.
2. **Responsible role architecture.** One neutral form serves Superadmin, Admin, and Vendor without letting users self-select privilege. Tenant presentation remains branding context, not authorization.
3. **Solid form foundations.** Explicit labels, native email/password fields, autocomplete, password reveal, recovery visibility, preserved inputs, pending feedback, and server-side tenant checks provide a credible baseline. Desktop fields and submit action measure 48px high, and the mobile layout has no horizontal overflow.

### Cognitive Load

**1 of 8 checks failed: low cognitive load overall.**

The page passes single focus, chunking, grouping, one-thing-at-a-time, minimal choices, working-memory, and progressive-disclosure checks. It fails visual hierarchy on mobile: the wordmark, kicker, large promise, and description precede and outweigh the actual credential task. No decision point presents more than four visible options.

### Emotional Journey

- **Arrival:** The strongest peak. The network field and wordmark create confidence.
- **Credential entry:** Calm and focused, though repeated shields and “protected” language start to assert security rather than demonstrate it.
- **Failure:** The emotional valley. Invalid credentials are understandable, but binding failures can become technical English.
- **Recovery:** Password-reset success appears both inline and as a toast; at 390×844 the toast can cover the lower task area.
- **Completion:** “Signing in…” and the redirect message reassure, but no useful support path exists if the destination cannot open.

The page’s emotional peak is decorative arrival; it should instead peak when the user successfully regains access.

### Priority Issues

#### [P1] “Remember me” appears to have no behavioral effect

**Why it matters:** The checkbox is rendered and submitted, but `loginAction` does not parse or consume `remember`. On a shared or managed device, users may incorrectly believe leaving it unchecked prevents persistent access.

**Fix:** Remove it until session duration can genuinely vary, or implement an explicit session-duration policy and rename it to “Keep me signed in on this device,” with shared-device implications made clear.

**Suggested command:** `$impeccable harden`

#### [P1] Failure and accessibility copy breaks localization and exposes internals

**Why it matters:** Chinese and Thai users can receive English server errors. Some authorization failures mention `app_metadata.role`, `admin_id`, and `vendor_company_id`. Password reveal is also announced as English “Show password / Hide password” in every locale. This damages comprehension at the highest-anxiety moment.

**Fix:** Return stable server error codes, map them to localized nontechnical UI messages, keep diagnostic details server-side, and localize reveal/hide accessible labels.

**Suggested command:** `$impeccable clarify`

#### [P1] Help and wrong-workspace recovery lead to dead ends

**Why it matters:** Platform users see “Contact your workspace administrator” without a link or identity; Superadmins and tenant administrators may be that person. Invalid or unavailable tenant links silently fall back to Plexus presentation, which is privacy-safe but confusing.

**Fix:** Add an actionable Plexus help route or approved support address for platform mode. Tenant mode should use the tenant support contact with a secure central fallback. For invalid tenant context, show a privacy-safe explanation such as “This organization link is unavailable—continue with Plexus or contact your organizer.”

**Suggested command:** `$impeccable onboard`

#### [P2] Mobile hierarchy and recovery feedback compete with sign-in

**Why it matters:** At 390×844, the base document is about 903–905px tall; the password-updated state reaches about 974px. The brand narrative comes first, while duplicate inline/toast recovery feedback can cover the lower form and push support off-screen.

**Fix:** Compact the mobile brand block, keep the form dominant in the first viewport, use one persistent inline reset-success message, suppress the duplicate toast, and clear the query flag after announcement.

**Suggested command:** `$impeccable adapt`

#### [P2] Secondary controls and low-opacity copy need an accessibility floor

**Why it matters:** The reveal control is 28×28px, the forgot-password link is roughly 16px high, the checkbox target is marginal, and essential assurance/support text is only 11px at low white opacity. The accessibility tree also exposed a second unlabeled checkbox node that needs verification.

**Fix:** Give every interactive target at least 44×44px, raise essential support text to 13–14px with verified contrast, check the Radix checkbox’s announced structure, and test keyboard, screen-reader, zoom, and branded-color variants.

**Suggested command:** `$impeccable audit`

### Persona Red Flags

- **Jordan, first-time user:** The primary action is obvious and no role choice is required. After a binding failure, Jordan can receive technical English and then an unclickable “contact your administrator” instruction. Likely abandonment point: first unsuccessful attempt.
- **Sam, accessibility-dependent user:** Labels, native input types, autocomplete, and visible focus styles help. English-only password-reveal labels, duplicate success announcements, the possible duplicate checkbox node, small targets, and subdued text weaken keyboard/screen-reader/low-vision use.
- **Casey, distracted mobile user:** The sign-in action remains in the first viewport, but the brand story takes the visual lead, support falls below it, and the reset-success state becomes longer while a toast overlays the task. The 28px eye control is a poor one-handed target.
- **Maya, Plexus platform operator:** Shared role-directed login is efficient. During an access incident, Maya can be told to contact herself and may receive internal binding language. Silent tenant fallback also makes it harder to diagnose whether the user opened the correct organization link.

### Minor Observations

- “Sign in” dominates the copy while the CTA says “Login.”
- The pending button retains two static icons; one clear progress affordance would read better.
- `?passwordUpdated=1` re-announces on reload.
- The login route inherits the marketing title instead of a task-specific “Sign in to Plexus.”
- There is no visible locale selector on a multilingual entry surface.
- Inter is loaded with only its Latin subset, so Thai and Chinese depend on device-specific system fallback.
- Long tenant names/logos need stronger defensive layout constraints.
- Native invalid states do not receive persistent inline messages or `aria-invalid` treatment.
- Live tenant branding could not be verified: `?tenant=plexus-managed` fell back to platform mode in the current local configuration.

### Questions to Consider

- If “Remember me” changes nothing, why should a security-conscious user trust the adjacent “Protected workspace access” message?
- Should mobile’s emotional peak be the network artwork, or the moment the user regains secure access?
- What is the correct next action when a Superadmin is told to contact their workspace administrator?
- Should an unavailable tenant link silently become Plexus, or explain the fallback without revealing tenant existence?
