**Public Website Verification**

**Source Brief**
- Browser annotation: Plexus public website spec for the marketing front door, sitemap, homepage sections, locale-backed copy, and shared tenant-aware footer.

**Implementation Evidence**
- Local URL: `http://localhost:3001/?lang=en`
- Homepage desktop screenshot: `/tmp/plexus-public-home.png`
- Homepage mobile screenshot: `/tmp/plexus-public-mobile.png`
- Bahasa Malaysia mobile route screenshot: `/tmp/plexus-public-ms-mobile.png`

**Viewport And State**
- Desktop: current in-app browser viewport, public homepage, unauthenticated, English locale.
- Mobile: 390 x 900, public homepage, unauthenticated, English locale.
- Additional route check: `/for-businesses?lang=ms`.

**Checks Run**
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Route probes: `/`, `/for-vendors`, `/for-businesses`, `/legal/privacy`, and `/help` returned 200 after dev server restart.
- Mobile overflow check: `scrollWidth` equals `innerWidth` at 390px.
- Browser console errors on homepage capture: none.

**Findings**
- No P0/P1/P2 issues remain for the implemented MVP public marketing layer.

**Notes**
- Social URLs and registered entity/SSM number are still intentionally marked as placeholders and need real production values.
- Footer tenant branding is implemented with a server-side hostname fallback and is ready to be connected to Supabase branding data when that row/schema exists.

**Final Result**
- final result: passed

---

**Future App `/app` Verification**

**Source Visual Truth**
- Supplied HTML: `/Users/chishiongtan/Downloads/plsxue.html`.
- Captured source: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/source-plsxue-desktop.png`.
- Full-view comparison: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/source-vs-app.png`.
- Focused feature comparison: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/source-vs-feature.png`.

**Implementation Evidence**
- Route: `http://127.0.0.1:3000/app`.
- Desktop screenshot: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/app-desktop.png`.
- Feature screenshot: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/app-feature.png`.
- Mobile screenshot: `/Users/chishiongtan/Documents/plexus-connect-demo/.design-qa/app-mobile.png`.

**Viewport And State**
- Desktop: 1440 x 1000, unauthenticated, top-of-page and first feature states.
- Mobile: 390 x 844, unauthenticated, top-of-page state.
- Mobile horizontal overflow: none (`scrollWidth` equals `innerWidth`, both 390px).

**Full-view Comparison Evidence**
- The implementation preserves the source's midnight navy canvas, warm-paper serif display type, brass italic emphasis, compact mono labels, restrained borders, and editorial spacing rhythm.
- The original text-only feature reel was intentionally elevated into a split hero with generated product imagery to meet the requested super-app introduction.
- Above-the-fold proportions, navigation weight, headline hierarchy, and content density remain faithful to the source while presenting a more product-led future vision.

**Focused Region Comparison Evidence**
- The Company Brain section retains the source's alternating image/copy structure, small jade phase label, large serif title, muted supporting copy, and brass signal panel.
- The source placeholder glyph was intentionally replaced with a purpose-built cinematic feature image. Crop, contrast, and visual density remain consistent with the hero art direction.

**Required Fidelity Surfaces**
- Fonts and typography: passed. Georgia provides the source's editorial serif character; existing Inter and Geist Mono variables provide legible product copy and labels with matching hierarchy and wrapping.
- Spacing and layout rhythm: passed. Desktop uses a stable 1240px content frame and generous section rhythm; mobile collapses cleanly with no horizontal overflow.
- Colors and visual tokens: passed. Navy, warm paper, brass, jade, and coral match the supplied source palette and retain accessible foreground contrast.
- Image quality and asset fidelity: passed. Six high-resolution generated assets share one cinematic paper/brass/smoked-glass direction and use responsive `next/image` rendering with meaningful alt text.
- Copy and content: passed. The narrative expands the supplied feature set into a clear super-app journey without changing the core PLEXUS/PLEXA proposition.

**Primary Interactions Tested**
- `Explore the future app` navigates to `#experience`.
- Header and CTA links expose valid destinations.
- Image hover treatment and responsive layouts render correctly.
- Browser console: no runtime errors. The initial LCP warning was resolved by eagerly loading the hero image.

**Comparison History**
- Initial pass: browser reported an LCP loading warning for the hero image.
- Fix: set the above-the-fold hero image to eager loading while retaining Next.js priority optimization.
- Post-fix evidence: typecheck, lint, production build, desktop render, feature render, mobile render, overflow check, and primary CTA test all passed.

**Findings**
- No actionable P0/P1/P2 issues remain.

**Follow-up Polish**
- P3: replace Georgia with Fraunces through `next/font` if exact typographic parity with the standalone HTML becomes a priority.

**Implementation Checklist**
- Six generated feature assets placed in the project.
- Responsive `/app` route implemented.
- Desktop and mobile layout verified.
- Core navigation and CTA verified.
- Typecheck, lint, and production build passed.

**Final Result**
- final result: passed
