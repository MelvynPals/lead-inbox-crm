# Verification results

## Form refinement verification

Dropdown wrapping follow-up: nine dashboard browser checks pass, including a 150px-wide trigger with 20px popup text. All categories and the checkmark fit on one line without clipping. Filter submission/clearing, editor values, mobile fallback and clean hydration still pass. CSS-only change; build and API smoke were not rerun.

Dashboard dropdown follow-up: eight headless-browser checks pass: empty filter defaults; keyboard selection submits exact status/category values; All options clear filters; lead editor submits one valid status; native mobile controls preserve values and fit 375px; applying filters updates URL and labels; clearing filters restores leads; no hydration warnings. The ten public-form browser checks also pass after sharing the component. Production build, TypeScript and lint pass. No lead edits were saved and no webhook was sent. API smoke was not rerun because API code did not change.

After removing the brand icon, pairing phone/service, and adding Radix Select with Lucide icons, production build, TypeScript and lint pass. Ten headless-browser checks pass: header icon removed; desktop phone/service alignment; linked required-service error; centered Lucide chevron rotated when open; keyboard selection submits exactly one service value; Escape closes, resets the chevron and restores focus; native mobile select preserves selection; mobile changes update the value without horizontal overflow; selection survives returning to desktop; clean-browser hydration has no errors. Mobile viewport: 375px. Only an invalid empty form was submitted; no leads or webhooks were created. API smoke was not rerun because API code did not change. Real-phone picker behavior remains unverified.

Verified locally on 2026-11-08 with the production Next.js build and configured Neon database. API: 52 pass, 0 fail. Owner: 10 pass, 0 fail. Unit tests: 5 pass, 0 fail. Build, TypeScript, ESLint and diff whitespace checks pass.

## API smoke: each check

| Check | Result |
| --- | --- |
| Public OPTIONS: 204 and CORS | PASS |
| Public POST: 201, exact keys, numeric ID, raw text, defaults, enum values, UTC timestamp without milliseconds, CORS | PASS |
| POST malformed JSON: 400 | PASS |
| POST null: 400 | PASS |
| POST array: 400 | PASS |
| POST missing fields: 400 | PASS |
| POST wrong field types: 400 | PASS |
| POST blank name: 400 | PASS |
| POST invalid email: 400 | PASS |
| POST invalid service: 400 | PASS |
| POST long name: 400 | PASS |
| POST long phone: 400 | PASS |
| POST long message: 400 | PASS |
| GET list, missing token: 401 | PASS |
| GET list, wrong token: 401 | PASS |
| GET non-numeric ID, missing token: 401 | PASS |
| GET non-numeric ID, wrong token: 401 | PASS |
| GET missing ID, missing token: 401 | PASS |
| GET missing ID, wrong token: 401 | PASS |
| PATCH non-numeric ID, missing token: 401 | PASS |
| PATCH non-numeric ID, wrong token: 401 | PASS |
| PATCH missing ID, missing token: 401 | PASS |
| PATCH missing ID, wrong token: 401 | PASS |
| GET list, unfiltered: 200, newest first, capped at 500 | PASS |
| GET status filter: 200 and matching results | PASS |
| GET category filter: 200 and matching results | PASS |
| GET combined filters: 200 and matching results | PASS |
| GET invalid status: 400 | PASS |
| GET invalid category: 400 | PASS |
| GET empty status: 400 | PASS |
| GET valid status with invalid category: 400 | PASS |
| GET existing ID: 200 | PASS |
| GET non-numeric ID: 404 | PASS |
| GET missing numeric ID: 404 | PASS |
| GET oversized numeric ID: 404 | PASS |
| PATCH non-numeric ID: 404 | PASS |
| PATCH missing numeric ID: 404 | PASS |
| PATCH oversized numeric ID: 404 | PASS |
| PATCH contacted status: 200, persisted | PASS |
| PATCH won status: 200, persisted | PASS |
| PATCH lost status: 200, persisted | PASS |
| PATCH new status and raw note together: 200, persisted | PASS |
| PATCH replacement note: 200, persisted | PASS |
| PATCH empty note clears old note: 200, persisted | PASS |
| PATCH malformed JSON: 400 | PASS |
| PATCH null: 400 | PASS |
| PATCH array: 400 | PASS |
| PATCH neither supported field: 400 | PASS |
| PATCH invalid status: 400 | PASS |
| PATCH wrong status type: 400 | PASS |
| PATCH null note: 400 | PASS |
| PATCH long note: 400 | PASS |

Every tested error also verifies an object containing only a string `error` field. Each full API smoke run retains one lead and invokes normal webhook delivery. Two full runs were completed, one in development and one in production.

## Owner smoke: each check

| Check | Result |
| --- | --- |
| Public page and all form fields return 200 | PASS |
| Dashboard redirects an unauthenticated visitor without exposing leads | PASS |
| Forged owner cookie cannot read leads | PASS |
| Wrong owner credentials show an error without a session | PASS |
| Correct credentials issue a signed httpOnly SameSite cookie and redirect | PASS |
| Signed session loads dashboard without exposing API_TOKEN | PASS |
| Owner save persists changed status and note; original values restored afterward | PASS |
| Owner save rejects missing session | PASS |
| Combined dashboard filters render for the owner | PASS |
| Logout clears the owner cookie and redirects to login | PASS |

These tests submit rendered forms over HTTP. They do not exercise client-side React interactions in a browser.

## Unit tests: each group

| Check | Result |
| --- | --- |
| Lead validation, raw text preservation, defaults, ignored unknown fields | PASS |
| PATCH, filters and ID boundaries | PASS |
| Keyword categories, precedence and urgency | PASS |
| Session signatures, tampering and expiry | PASS |
| AI failure/invalid-output fallback and webhook failure isolation | PASS |

## Browser review and limits

The public form and authenticated dashboard were captured and visually reviewed at 375px in headless Chrome. Inputs and buttons fit; cards stack and filters wrap. Real hardware was not tested.

The marketing design checker reports `GATE: FAIL 18 (round 2 of 3)`. No waivers were added. Open checks concern promotional visuals/motion, full-screen section rhythm, marketing grid alignment and having the form's submit button above the first mobile fold. These rules do not match the requested functional form/inbox layout. Its text-contrast and focus-visible failures were fixed and pass on the second run. The checker retains warnings for missing social-share metadata, optional-field heuristics, footer height and brand-link target height.

External webhook receipt at the grading endpoint and successful paid AI-provider responses were not independently confirmed. The application attempts delivery, isolates webhook errors and uses tested keyword fallback for AI failures. No deployment was performed.
