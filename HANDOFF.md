# Lead Inbox

## Run locally

Use Node 22+ and pnpm. Run `pnpm install`, copy `.env.example` to `.env.local`, fill in the values, then run `pnpm db:migrate` and `pnpm dev`. The migration is safe to rerun. Open http://localhost:3000.

Owner login: `<OWNER_EMAIL>` / `<OWNER_PASSWORD>` at `/login`.
API token: `<API_TOKEN>`. Real credentials stay in the environment and are shared privately.

## What works

- Postgres persistence and repeatable table initialization.
- All lead API routes, validation, filters, bearer authentication and public POST CORS.
- Keyword sorting, optional AI classification with a four-second timeout and validated strict output.
- Awaited webhook delivery with a three-second timeout; failures do not undo a save.
- Unit tests and a contract smoke script. The script retains one lead per run.
- Public form with per-field errors, pending state and success confirmation.
- The public form uses four accessible service radio cards, a live message counter and a personalized confirmation with request summary. The sample business header includes a custom home/sun mark.
- Dashboard status summaries toggle URL filters; status/category chips preserve each other and include All. The chip rows scroll internally on small screens.
- Lead status saves on change with optimistic feedback and restores the prior value on failure. Private notes save explicitly; the last saved note remains visible. Both use the original session-protected server action.
- Cards include expandable three-line message previews, email/phone links, warm status/urgency badges and skeleton loading states.
- Signed httpOnly owner session, logout, protected dashboard, combined filters and status/note editing through server actions. Sessions last eight hours. Cookies are Secure in production and SameSite=Lax. Server actions check the session on every save.

## Limits

- Deployment is the owner's task. No accounts or hosted configuration were changed.
- No durable webhook retries, pagination, password recovery or login rate limiting in this test scope.
- Layout is checked in headless Chrome; real-phone testing remains for the owner.

## Assumptions and decisions

- The public form is branded as a sample business, editable in `src/content/business.ts`. Trust points and business hours are sample copy to confirm before real business use.

- Service is required. Text length checks use trimmed text; storage and responses preserve raw text, including case and whitespace.
- Phone is free text, optional, max 30 characters; missing phone and note become empty strings.
- Invalid filters return 400. Authentication runs before checking IDs. Non-numeric or missing IDs return 404.
- Notes replace the previous note, including an empty string to clear it. Trimmed note limit is 2000 characters.
- Lists return at most 500 leads, newest first, with ID breaking timestamp ties.
- Timestamps are UTC with a Z and no milliseconds.
- Webhooks are awaited with a three-second timeout; no retries or delivery queue.
- AI has a four-second timeout. Anthropic takes priority if both keys exist; otherwise OpenAI is used. All AI failures fall back to keyword rules. Classification uses the original message; no key is needed.
- OPTIONS is public for browser preflight. Database failures return a generic JSON error with status 500.
- Run the migration before deploying. Do not run it during every request or build.
- Dashboard dates display in the viewer's local timezone, with a timezone label, full date/time and relative age refreshed every minute. A hydration-safe placeholder is used before the browser is ready; API timestamps remain UTC. Filters are URL links and work without JavaScript. The public form and automatic status saving require JavaScript.
- Summary counts describe the latest 500 leads, matching the existing bounded query. Filtered lists still use the existing server query.

## Verification

- API smoke: 52 passed, 0 failed. Each check is printed by `pnpm smoke`.
- Owner smoke: 10 passed, 0 failed. Run `pnpm smoke:owner`; it creates no leads and restores the original lead values after testing a save.
- Unit tests: 5 passed, 0 failed, covering validation/raw text, patch/filter/ID boundaries, keyword rules, session signatures and AI/webhook failure isolation.
- Production build, TypeScript and ESLint pass. API checks ran locally against the configured Neon database; owner checks ran against the production server.
- The marketing-site design gate is not an acceptance test for this functional form/inbox. It flags absent promotional imagery/motion and full-screen marketing sections. The useful focus/contrast findings were addressed. Mobile browser captures are reviewed separately.
- Per-check results and remaining design-checker flags are in `references/VERIFICATION.md`. The public form and authenticated dashboard were visually reviewed at 375px. External webhook receipt and paid AI-provider success were not independently confirmed.

## Deploy

The dependency build approval for `esbuild` is committed in `pnpm-workspace.yaml` after running `pnpm approve-builds`. Existing disabled approvals remain unchanged.

On Vercel, use the Next.js preset, `pnpm install --frozen-lockfile`, and `pnpm build`. Set DATABASE_URL, API_TOKEN, OWNER_EMAIL, OWNER_PASSWORD and SESSION_SECRET. Set WEBHOOK_URL for notifications. ANTHROPIC_API_KEY and OPENAI_API_KEY are optional. Use the Neon connection URL with SSL enabled. Run `pnpm db:migrate` against that database before serving traffic. Verify with `BASE_URL=https://your-app.example pnpm smoke` (PowerShell: `$env:BASE_URL='https://your-app.example'; pnpm smoke`). Do not put secrets in the repo.

## Next

Add durable webhook retries and rate limiting if this moves beyond the hiring test. Add pagination if the inbox grows beyond the newest 500 leads.
