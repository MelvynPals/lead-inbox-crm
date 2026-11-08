# Lead Inbox handoff

## Live URL and repo

Live: https://lead-inbox-crm.vercel.app
Repo: https://github.com/MelvynPals/lead-inbox-crm

## How to run it

I use Node 22+, pnpm 12.16.1 and Postgres. Browser smoke tests need Chrome or Edge.
Run `pnpm install`, copy `.env.example` to `.env.local`, and fill in DATABASE_URL, API_TOKEN, WEBHOOK_URL, OWNER_EMAIL, OWNER_PASSWORD and SESSION_SECRET. Optional: ANTHROPIC_API_KEY, OPENAI_API_KEY and CHROME_PATH.
Run `pnpm db:migrate`, then `pnpm dev`. Open http://localhost:3000.
Checks: `pnpm test`, `pnpm build`, `pnpm exec tsc --noEmit` and `pnpm lint`.
Smokes: `pnpm smoke`, `pnpm smoke:owner`, `pnpm smoke:inbox` and `pnpm smoke:polish`. They use BASE_URL, which defaults to localhost:3000. For live checks in PowerShell: `$env:BASE_URL='https://lead-inbox-crm.vercel.app'; pnpm smoke; pnpm smoke:owner`.

## Owner login

I sign in at `/login`, which leads to `/dashboard`.
Email: `superuser@admin.com`
Password: `superuser123`

## API_TOKEN

`5aba364793ce5464dbf96d14ddfc01bcb93236ca60682195f16a829cba594fa1`

Example:

```sh
curl 'https://lead-inbox-crm.vercel.app/api/leads' -H 'Authorization: Bearer 5aba364793ce5464dbf96d14ddfc01bcb93236ca60682195f16a829cba594fa1'
```

## What works

- I built the public form with inline errors, server validation and a confirmation state.
- Leads persist in Neon Postgres.
- The API returns POST 201, GET/PATCH 200, bad input/filter 400, missing/wrong token 401 and missing ID 404. OPTIONS returns 204. Lists use {"leads": [...]}; errors use {"error": "..."}.
- Each lead is sorted into a category and urgency using keyword rules when AI is unavailable.
- I verified live lead.created webhook delivery on webhook.site. Delivery failures do not fail the saved lead.
- The mobile owner dashboard has login protection, status/category filters, status updates, private notes and search.
- My live checks on 2026-11-09 passed: API 52/52; owner 10/10; no failures. The API test retained one verification lead; the owner test restored its edits.
- I checked the form, login and dashboard on a real phone (POCO F9 Ultra, Android 16, Chrome 157.0.8103.46) on 2026-11-09. The test left one "Mobile Check" lead in the live inbox, restored to New with no note.

## What doesn't / not verified

I have not set an AI key on the live deployment, so every lead uses the required keyword fallback. ANTHROPIC_API_KEY or OPENAI_API_KEY enables the supported AI path, but I have not exercised it live.

## Assumptions

- Service is required: cleaning, repair, consultation or other.
- Validation uses trimmed text; storage and responses preserve the raw text and case.
- Phone is optional free text, max 30 characters; missing phone and note default to an empty string.
- Invalid status/category filter values return 400.
- Authentication is checked before ID lookup; missing or non-numeric IDs return 404.
- PATCH replaces the note, max 2000 trimmed characters; an empty PATCH returns 400.
- GET returns the newest 500 at most, with ID breaking timestamp ties; dashboard counts use that same limit.
- I save first, then await the webhook with a 1.5s timeout; failure never prevents or undoes the save. There are no retries yet.
- Owner sessions last 8 hours and use a signed httpOnly cookie, Secure in production and SameSite=Lax.
- Dashboard times use the viewer's local timezone; API timestamps remain UTC with Z and no milliseconds.
- The public form is the sample business Brightside Home Services, editable in src/content/business.ts; trust points and hours are sample copy.
- CORS is open on POST /api/leads; OPTIONS preflight is public.
- AI calls have a 4s timeout and fall back to keyword rules on failure; Anthropic takes priority if both keys exist.
- I run the migration before serving traffic; database failures return a generic JSON error.
- Search covers loaded requests and resets on reload; status/category persist in the URL and drafts stay local until saved.
- The public form, status tiles, search and saving require JavaScript.
- I use slightly darker clay and input borders so text and controls meet AA contrast.

## What I'd do next

- Add rate limiting and a honeypot to the public form.
- Add multi-user auth with roles.
- Add pagination or a cursor to GET /api/leads.
- Add webhook retries with a delivery log.
- Exercise AI sorting with an eval set to tune the rules.
