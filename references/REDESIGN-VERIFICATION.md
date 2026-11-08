# Brightside UI redesign verification

Hover contrast follow-up: six browser checks pass for primary buttons, select-trigger text/icons, quiet buttons, text actions, toast dismiss buttons and secondary links. Dark clay hovers use white; light and transparent hover states retain contrasting foregrounds. No forms were submitted. CSS-only fix; build and API/owner smoke were not rerun for this follow-up.

The change is confined to UI components, sections, presentation metadata, fonts, styles, business content and the owner smoke script's filter-markup assertion. `app/api/`, `src/lib/` and `app/actions.ts` are unchanged from the previous UI commit. No API contract, validation, sorting, webhook, auth or persistence behavior was changed.

## Required checks

| Command/check | Result |
| --- | --- |
| `pnpm test` | PASS: 5 test groups |
| `BASE_URL=http://localhost:3001 pnpm smoke` | PASS: 52 checks |
| `BASE_URL=http://localhost:3001 pnpm smoke:owner` | PASS: 10 checks |
| `pnpm build` | PASS |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm lint` | PASS, no warnings |
| `git diff --check` | PASS |

The existing per-check API and owner tables in `VERIFICATION.md` still apply. The owner filter check now verifies both chip navigation groups and their active state, replacing the obsolete Apply filters button assertion. It still checks protected access, credential failure/success, session issuance, persistence, rejection without a session and logout.

API smoke was run twice during this redesign, retaining one test lead per run and performing normal webhook delivery. Owner smoke restores the original values of the lead it exercises. Public-form browser submissions use intercepted responses, so those checks create no leads or webhook traffic.

## Browser checks

All 21 checks pass in headless Chrome against the production build. Each page was captured and reviewed at 375px, 768px and 1280px.

1. Public form at 375px: no page overflow, tap targets at least 44px, requested fonts loaded.
2. Login at 375px: same checks.
3. Dashboard at 375px: same checks; only chip rows scroll internally.
4. Public form at 768px: same checks.
5. Login at 768px: same checks.
6. Dashboard at 768px: same checks.
7. Public form at 1280px: same checks.
8. Login at 1280px: same checks.
9. Dashboard at 1280px: same checks.
10. Public content contains the sample business branding and no Lead Inbox label.
11. An invalid submission shows inline errors and focuses the first invalid field.
12. Arrow keys select native service radios with the original enum values; the focused card has a visible outline.
13. Message count updates and changes to the warning color near the limit.
14. A server rejection focuses the summary and retains entered details.
15. Success shows the first name and summary; name, phone and message whitespace survive in the request. The native email input retains its existing browser normalization behavior; direct API raw-text preservation is covered by API smoke.
16. Send another request clears the form and counter.
17. Dashboard full timestamps use the viewer's timezone (tested with Asia/Manila), with a timezone label.
18. A status summary tile sets its URL filter and a second tap clears it.
19. An unmatched category shows a no-matches state with Clear filters.
20. Aborting a status-save request restores the previous status and shows an accessible error toast.
21. Navigation and interaction produce no hydration mismatch in a clean browser.

The owner smoke additionally verifies an actual note/status save against Postgres. Browser screenshots and local check scripts are ignored under `.taste-skill/`. Real-phone behavior remains unverified.

## Contrast and accessibility

Body on cream: 14.30:1. Muted text on cream: 5.86:1. Primary button white text exceeds 5:1. Input boundaries against the warm surface: 3.32:1. New/contacted/won/lost badge text exceeds 5:1. High urgency text exceeds 5:1. The selected service text exceeds 4.5:1 after darkening the clay token. These meet AA for the applicable text and control roles. Soft decorative card borders are not used as the sole indication of a control.

Native radio semantics provide arrow-key navigation and a single submitted service value. Labels, legends and inline error descriptions are retained. Status failure uses an alert toast; notes and saved feedback use live regions. Reduced-motion disables transitions and the success entrance. Server-rendered pages and sections remain server components; browser-only leaves handle time, expansion and forms.

## Design gate: each remaining finding

The marketing gate was rerun against the public form as a service page. It reports 21 failures. None were hidden or waived. They are explained individually below; the gate is not reported as passing.

| # | Finding and target | Disposition |
| --- | --- | --- |
| 1 | `no-visual`: public intro/form | Kept: this is a functional request page. The brief specifies a custom mark and icon trust points, not a stock photograph, product mock or promotional effect. |
| 2 | `text-contrast`: muted subhead, 5.86:1 | AA passes. The gate requires 7:1, which is stricter than the requested AA and the supplied muted palette. |
| 3 | `focus-visible`: hidden native service radio | Detector limitation: focus is deliberately drawn on the full visible card sibling with a 3px primary outline. Keyboard navigation and that computed outline were separately verified. |
| 4 | `moment-none`: no promotional motion scene | Kept: the brief asks for subtle motion only. Button feedback and a reduced-motion-aware success entrance are present; a marketing scene would add unrequested motion. |
| 5 | `hero-screen`: form taller than one desktop screen | Kept: comfortable inputs, service choices and error space determine form height. A fixed marketing hero would compress or clip the form. |
| 6 | `section-height`: footer shorter than one screen | Kept: the requested footer is small and muted, without floating empty space. |
| 7 | `section-height`: intro/form begins below header | Kept: a normal-flow header precedes the form. Screen-grid alignment would conflict with the requested layout. |
| 8 | `one-section`: footer visible with form | Kept: compact normal document flow is intentional; sections do not need separate full screens. |
| 9 | `one-heading`: form has an h2 inside the intro section | Kept: the public h1 introduces the page and the form h2 names its own task. This is a valid heading hierarchy. |
| 10 | `container-edges`: header uses a centered 1120px wrap | Kept: content has equal left/right edges; the check requires a specific 64–120px desktop gutter. The form remains comfortably readable. |
| 11 | `container-edges`: intro/form uses that same wrap | Kept for the same equal-edge, readable-width layout. |
| 12 | `container-edges`: footer uses that same wrap | Kept to align the compact footer with the header and page. |
| 13 | `container-edges`: skip link is outside the marketing nav | Kept: the first keyboard target is intentionally a root-level skip link and is visible on focus. |
| 14 | `container-edges`: shell and content wrappers lack kit-specific classes | Kept: the repository uses React page/section composition. Semantic header/main/section/footer landmarks are present. |
| 15 | `container-edges`: form labels and helper text are inset | Kept: inputs and service cards need consistent internal padding; these labels belong to controls inside a card. |
| 16 | `container-edges`: form h2 is in the right column | Kept: the brief explicitly asks for a desktop intro column beside the form. |
| 17 | `container-edges`: form card occupies the right column | Kept for that same explicit two-column composition. |
| 18 | `nav`: business name wraps on mobile | Kept: the complete business name fits on two readable lines with the mark and quiet owner link; no clipping or horizontal page scroll occurs. |
| 19 | `fold-action`: submit button is below the first mobile screen | Kept: the requested intro, trust points and full form stack naturally. The page scrolls normally and no control is hidden. |
| 20 | `edge-left`: form starts in the right desktop column | Kept: required split layout; it stacks at narrow widths. |
| 21 | `hero-fold`: content starts after the normal-flow header | Kept: the brief does not require an overlay header or viewport-sized marketing hero. |

The earlier short-screen flag no longer applies because the real form determines section height. Remaining warnings concern marketing fold/card framing, marketing axis preferences, social-share metadata and optional-field heuristics. Public fields are explicitly labelled; Phone number is marked optional. No invented address, testimonial, photograph or business fact was added beyond the explicitly requested sample copy.

## Assumptions and limits

- Business name, tagline, contact line, hours and trust copy are sample content, centralized in `src/content/business.ts` for replacement.
- Status counts cover the newest 500 leads, following the existing query limit. The UI labels that limit when reached.
- API timestamps remain UTC without milliseconds. Viewer-local formatting is presentation only and appears after hydration.
- Actual device testing and deployment remain with the owner. No push or deployment was performed.
