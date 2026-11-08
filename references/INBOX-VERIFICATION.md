# Compact inbox verification

This is a UI refinement. `app/api/`, `src/lib/` and `app/actions.ts` are unchanged. Existing server queries, validation, lead types, authentication and save actions are reused.

## Changes

- Cards start collapsed. Short-message desktop cards measure 120px; longer names/messages can grow naturally. Each full-card native button exposes `aria-expanded` and supports Enter/Space. Only one request is selected at a time.
- Cards show name/service, status edge and pill, distinct soft category badge, relative time with full local timestamp in its title, and a note icon when a saved note exists. Only high urgency displays an Urgent badge; normal/low urgency are omitted to reduce clutter.
- The message preview is clamped to two lines. ResizeObserver and font readiness measure actual overflow before showing Read full message.
- At 1024px and above, a 420px list sits beside a sticky detail pane. An unselected pane says Select a request. Long details scroll within the pane. Below 1024px the selected detail appears inside its card.
- Expanded details contain the full message, mailto/tel links, wrapping status pill buttons and a note editor. The last-saved-note block is removed. At 375px status buttons use a balanced two-column grid.
- Status updates retain optimistic saving, Saved feedback and error rollback. Saved feedback beside the count remains visible even if the updated request leaves the active filter. Notes save explicitly and unsaved drafts survive selection/viewport changes.
- All/status tiles are the only status filters, with `aria-pressed` and an active ring. Clicking the selected status again clears it. Category chips retain status; both remain in the URL.
- Search is a 250ms debounced, case-insensitive substring match across name/email/phone/message in the loaded server-filtered list. Clear is immediate. The count is matching requests out of the current bounded total. Search has no API and resets on a full reload.

## Required checks

| Check | Result |
| --- | --- |
| `pnpm test` | PASS: 5 groups |
| `pnpm smoke` | PASS: 52 checks |
| `pnpm smoke:owner` | PASS: 10 checks |
| `pnpm smoke:inbox` | PASS: 16 checks |
| `pnpm build` | PASS |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm lint` | PASS, no warnings |
| `git diff --check` | PASS |

Tests ran against an isolated local production server using the configured Postgres database. Two complete API smoke runs were performed, each retaining one verification lead and performing its normal webhook delivery. Owner smoke restores the original status/note after testing a real save. Inbox checks do not save changes.

The API check-by-check table remains in `VERIFICATION.md`. All ten owner checks remain: public fields, unauthenticated/forged-session rejection, wrong/correct login, protected data without token exposure, persisted owner save, rejected save without session, filters and logout. The save check now opens the actual collapsed editor in headless Chrome, changes status with a pill, saves a note, verifies the note indicator and confirms persistence through the API. It does not bypass owner auth or the UI save action. Missing-session rejection is also tested through that editor.

## Inbox browser checks

All 16 checks pass:

1. Collapsed initial state, All pressed, no duplicate status row.
2. At 375px: no page overflow, one inline editor, wrapping pills, targets at least 44px.
3. At 768px: same single-column behavior and target checks.
4. At 1024px: 420px list, sticky separate pane, single editor and compact card height.
5. At 1280px: same desktop checks.
6. Native keyboard activation and switching cards retain one detail view.
7. Long text shows Read full message; short text does not, using an ephemeral DOM measurement fixture.
8. Search matches name.
9. Search matches email.
10. Search matches phone.
11. Search matches message.
12. Clear search restores the list and count.
13. Search combines with URL status/category filters; clicking the pressed tile clears status while retaining category.
14. Draft notes survive switching requests and desktop/mobile layout changes.
15. An intercepted failed status save restores the selected pill, shows the error toast and retains the note draft.
16. No hydration mismatch while navigating, resizing or editing.

Screenshots at all four widths were reviewed; they remain ignored under `.taste-skill/`. The palette/fonts and public/login UI are unchanged by this task. The previous marketing-gate assessment in `REDESIGN-VERIFICATION.md` applies to the public page; no marketing layout was added to this functional inbox.

## Running browser checks and limits

Owner and inbox smoke now need a local Chrome or Edge executable, launched headlessly via the standard DevTools protocol. No browser dependency was added. Common Windows, Linux and macOS paths are detected; optional `CHROME_PATH` selects another executable. Profiles/screenshots stay ignored under `.taste-skill/`; credentials are not printed and API_TOKEN is never passed to browser code. `BASE_URL` still selects the app to test.

Run API smoke before inbox smoke; the selection regression checks need at least two existing requests. Search/counts remain bounded by the existing 500-lead query limit. Real-phone testing remains outstanding. No deployment or push was performed.
