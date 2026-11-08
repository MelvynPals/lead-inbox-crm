# Lead Inbox

## Run locally

Use Node 22+ and pnpm. Run `pnpm install`, copy `.env.example` to `.env.local`, fill in the values, then run `pnpm db:migrate` and `pnpm dev`. The migration is safe to rerun. Open http://localhost:3000.

Owner login: `<OWNER_EMAIL>` / `<OWNER_PASSWORD>` at `/login`.
API token: `<API_TOKEN>`. Real credentials stay in the environment and are shared privately.

## What works

- Postgres persistence and repeatable table initialization.
- All lead API routes, validation, filters, bearer authentication and public POST CORS.
- Keyword sorting, optional AI classification with a four-second timeout and validated strict output.
- Awaited webhook delivery with a 1.5-second timeout; failures do not undo a save.
- Unit tests and a contract smoke script. The script retains one lead per run.
- Public form with per-field errors, pending state and success confirmation.
- The public form uses four accessible service radio cards, a live message counter and a personalized confirmation with request summary. The sample business header includes a custom home/sun mark.
- The dashboard starts with compact, button-operated request cards: status edges/pills, soft category badges, two-line message previews, one-line relative time and note indicators. Only high urgency shows an Urgent badge. Read full message appears only when overflow is measured.
- All/New/Contacted/Won/Lost tiles are the only status filters, with pressed state and toggle-to-clear behavior. Category chips retain the other filter. Debounced client-side search matches name, email, phone or message and combines with the URL filters; counts show matching requests out of the current bounded total.
- At 1024px and above the inbox uses a 420px list and sticky detail pane; below that, one request expands in place. The default desktop pane says Select a request.
- Status pill buttons save optimistically and revert on failure. Notes have an explicit Save button with saving/saved/error states. The last-saved-note block is removed. Unsaved drafts remain in local state while switching requests or viewport sizes. Both mutations use the original session-protected server action. Each action has one nearby, space-reserved Saved indicator; the count line has none.
- Dark button hover states use white labels/icons; secondary and text actions retain contrasting foregrounds on light or transparent hover backgrounds.
- Signed httpOnly owner session, logout, protected dashboard, combined filters and status/note editing through server actions. Sessions last eight hours. Cookies are Secure in production and SameSite=Lax. Server actions check the session on every save.

## Limits

- Deployment is the owner's task. No accounts or hosted configuration were changed.
- No durable webhook retries, pagination, password recovery or login rate limiting in this test scope.
- Layout is checked in headless Chrome; real-phone testing remains for the owner.

## Assumptions and decisions

- The public form is branded as a sample business, editable in `src/content/business.ts`. Trust points and business hours are sample copy to confirm before real business use.
- Clay buttons and input borders use slightly darker warm shades than the sample values so small text, selected service labels and control boundaries meet AA contrast. Card borders remain decorative and soft.

- Service is required. Text length checks use trimmed text; storage and responses preserve raw text, including case and whitespace.
- Phone is free text, optional, max 30 characters; missing phone and note become empty strings.
- Invalid filters return 400. Authentication runs before checking IDs. Non-numeric or missing IDs return 404.
- Notes replace the previous note, including an empty string to clear it. Trimmed note limit is 2000 characters.
- Lists return at most 500 leads, newest first, with ID breaking timestamp ties.
- Timestamps are UTC with a Z and no milliseconds.
- Webhooks are awaited with a 1.5-second timeout; no retries or delivery queue.
- AI has a four-second timeout. Anthropic takes priority if both keys exist; otherwise OpenAI is used. All AI failures fall back to keyword rules. Classification uses the original message; no key is needed.
- OPTIONS is public for browser preflight. Database failures return a generic JSON error with status 500.
- Run the migration before deploying. Do not run it during every request or build.
- Dashboard dates display in the viewer's local timezone, with full date/time and timezone in a tooltip on compact cards and visible in the detail pane. Relative age refreshes every minute. A hydration-safe placeholder is used before the browser is ready; API timestamps remain UTC. Category filters are URL links; status tile navigation, expansion, search and saving require JavaScript.
- Search covers the loaded, server-filtered requests, not older records beyond the existing 500-row query limit. Search text is local and resets on a full page reload; status/category remain in the URL. Long detail panes scroll internally while remaining sticky on desktop.
- Summary counts describe the latest 500 leads, matching the existing bounded query. Filtered lists still use the existing server query.

## Verification

- API smoke: 52 passed, 0 failed. Each check is printed by `pnpm smoke`.
- Owner smoke: 10 passed, 0 failed. Run `pnpm smoke:owner`; it creates no leads and restores the original lead values after testing a save.
- Unit tests: 6 passed, 0 failed, covering validation/raw text, patch/filter/ID boundaries, keyword rules, session signatures and AI/webhook failure isolation.
- Production build, TypeScript and ESLint pass. API checks ran locally against the configured Neon database; owner checks ran against the production server.
- The marketing-site design gate is not an acceptance test for this functional form/inbox. It flags absent promotional imagery/motion and full-screen marketing sections. The useful focus/contrast findings were addressed. Mobile browser captures are reviewed separately.
- Per-check results and remaining design-checker flags are in `references/VERIFICATION.md`. The public form and authenticated dashboard were visually reviewed at 375px. External webhook receipt and paid AI-provider success were not independently confirmed.
- The Brightside redesign passes all 52 API, 10 owner and 6 unit checks, production build, typecheck and lint, plus 21 browser checks across 375/768/1280px. `references/REDESIGN-VERIFICATION.md` records each check and explains each remaining marketing-gate finding. The gate is not marked as passing.
- Compact inbox verification is in `references/INBOX-VERIFICATION.md`. Owner smoke now opens the real collapsed editor in Chrome/Edge. `pnpm smoke:inbox` covers search, expansion, responsive panes, draft retention, clamping and failed-save recovery. Set optional `CHROME_PATH` if the browser is not installed in a standard location.
- The latest polish passes 52 API, 10 owner, 16 inbox and 2 polish checks plus 6 unit groups, build/typecheck/lint. `references/POLISH-VERIFICATION.md` records webhook cancellation, stable feedback, retained scroll/selection, failed-login email retention/password clearing and success-card sizing.

## Deploy

The dependency build approval for `esbuild` is committed in `pnpm-workspace.yaml` after running `pnpm approve-builds`. Existing disabled approvals remain unchanged.

On Vercel, use the Next.js preset, `pnpm install --frozen-lockfile`, and `pnpm build`. Set DATABASE_URL, API_TOKEN, OWNER_EMAIL, OWNER_PASSWORD and SESSION_SECRET. Set WEBHOOK_URL for notifications. ANTHROPIC_API_KEY and OPENAI_API_KEY are optional. Use the Neon connection URL with SSL enabled. Run `pnpm db:migrate` against that database before serving traffic. Verify with `BASE_URL=https://your-app.example pnpm smoke` (PowerShell: `$env:BASE_URL='https://your-app.example'; pnpm smoke`). Do not put secrets in the repo.

## Next

Add durable webhook retries and rate limiting if this moves beyond the hiring test. Add pagination if the inbox grows beyond the newest 500 leads.
