# Lead Inbox

The lead inbox piece of a small CRM for service businesses: a public request form that customers fill in, and a private dashboard and JSON API the owner uses to work the leads.

**Status:** Production

## Tech stack

**Core**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NextJS](https://img.shields.io/badge/NextJS-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)

**Styling & UI**

![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Data**

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black)

**Infra & tooling**

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)

<details>
<summary>Versions</summary>

| Layer | Tech | Version |
| --- | --- | --- |
| Runtime | Node.js | 22+ |
| Framework | Next.js (App Router) | 16.4.5 |
| UI | React | 19.3.0 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 |
| Database client | postgres.js | ^4.1.0 |
| Database | Neon Postgres | managed |
| Package manager | pnpm | 12.16.1 |
| Hosting | Vercel | n/a |

</details>

| Environment | URL | Notes |
| --- | --- | --- |
| Production | <https://lead-inbox-crm.vercel.app> | Vercel, Neon Postgres |

---

## Getting started

### Prerequisites

- Node 22+ (needed for script environment loading)
- pnpm 12.16.1
- A Postgres database (Neon in production)
- Chrome or Edge, only for the browser-backed smoke tests

### Setup

```bash
git clone https://github.com/MelvynPals/lead-inbox-crm.git
cd lead-inbox-crm
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm dev
```

App runs at <http://localhost:3000>. The form is at `/`, owner login at `/login`, and the inbox at `/dashboard`.

### Environment variables

| Variable | Required | Purpose | Where to get it |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string | Neon dashboard |
| `API_TOKEN` | Yes | Bearer token required by every API route except `POST /api/leads` | Generate a long random string |
| `OWNER_EMAIL` | Yes | Owner login email | Choose one |
| `OWNER_PASSWORD` | Yes | Owner login password | Choose one |
| `SESSION_SECRET` | Yes | Signs the owner session cookie (32+ characters) | Generate a long random string |
| `WEBHOOK_URL` | No | Receives `lead.created` events; webhook is skipped if unset | Your receiving service |
| `ANTHROPIC_API_KEY` | No | Enables AI sorting; preferred if both AI keys are set | Anthropic console |
| `OPENAI_API_KEY` | No | Enables AI sorting when no Anthropic key is set | OpenAI dashboard |
| `CHROME_PATH` | No | Chrome or Edge executable for browser smoke tests, if outside a standard path | Local install |

> Real values live in `.env.local` locally and in Vercel's environment settings in production. Never commit them.

### Scripts

| Command | Does |
| --- | --- |
| `pnpm dev` | Start local dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm test` | Unit tests for `src/lib/*.test.ts` |
| `pnpm lint` | Lint |
| `pnpm exec tsc --noEmit` | Type check |
| `pnpm db:migrate` | Apply DB migrations (safe to rerun) |
| `pnpm smoke` | Hit every API route and status code against `BASE_URL` |
| `pnpm smoke:owner` | Owner login, protected data, saves, filters and logout |
| `pnpm smoke:inbox` | Dashboard layout, search, filters and drafts in headless Chrome or Edge |
| `pnpm smoke:polish` | Success-card sizing at mobile and desktop widths |

The smoke scripts read `BASE_URL` (default `http://localhost:3000`) and load `.env.local` if present. `pnpm smoke` creates one lead and fires the normal webhook.

---

## Architecture

Pages are server components that compose sections from `src/sections/`; only the form, filters, status buttons and note editor are client components. The dashboard reads Postgres on the server after checking the owner session cookie, so `API_TOKEN` never reaches the browser. A new lead is validated, sorted into a category and urgency (AI if a key is set, keyword rules otherwise), saved, and then sent to the webhook. Owner edits use server actions that share validation and queries with `PATCH /api/leads/{id}`.

### Directory structure

```
app/
  api/leads/          POST and GET list; [id]/ holds GET and PATCH
  (public)/           the request form
  (owner)/dashboard/  the owner inbox, behind the session cookie
  login/              owner login
  actions.ts          server actions: sign in, sign out, save edits
src/
  lib/                db, validation, sorting, webhook, auth, http helpers (with unit tests)
  sections/           one folder per page, one file per visual band
  components/         shared and client-side leaf components
  content/            sample business copy (business.ts)
migrations/           SQL migrations
scripts/              migration runner and smoke tests
references/           documentation, TODO and verification notes
```

### Data model

One table, `leads`, defined in `migrations/001_leads.sql`: serial `id`, `name`, `email`, `phone` (default empty), `service`, `message`, `category`, `urgency`, `status` (default `new`), `note` (default empty) and `created_at` (timestamptz). Enum columns use CHECK constraints, and an index on `(created_at DESC, id DESC)` serves the newest-first list.

### Decisions worth knowing

- Validate trimmed, store raw: checks run on trimmed text, but values are stored and returned exactly as submitted. Escaping happens at render time.
- Sorting never blocks a save: AI calls have a 4s timeout and strict JSON output, and any failure falls back to the keyword rules in `src/lib/sorting.ts`.
- Webhook is awaited after the save with a 1.5s timeout and every failure is caught, so a webhook outage never loses a lead. There are no retries yet.
- Auth is checked before the ID lookup: a bad token returns 401 even for an ID that doesn't exist, and a missing or non-numeric ID returns 404.
- Lists are capped at 500, and the dashboard summary counts use that same newest 500.
- Owner sessions are an HMAC-signed httpOnly cookie that lasts 8 hours (Secure in production, SameSite=Lax).
- Dashboard times render in the viewer's local timezone; API timestamps stay UTC with a `Z` and no milliseconds.

---

## Working in this repo

- Commits: short imperative messages, one per meaningful unit of work.
- Tests: run `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm build`, plus `pnpm smoke` for any API change.
- Migrations: add a numbered SQL file in `migrations/` and apply it with `pnpm db:migrate`. Write them so they are safe to rerun.

> TODO(owner): branch naming, PR review requirements and formatter or hook setup are not defined in the repo.

---

## Deployment

- Trigger: Vercel with the Next.js preset. There is no CI config in the repo.
- Pipeline: run `pnpm db:migrate` against Neon before serving new code, then build and deploy on Vercel.

> TODO(owner): promotion flow, rollback steps and where logs and monitoring live are not discoverable from the repo.

---

## Operations

### External dependencies

| Service | Used for | Account owner | Breaks if... |
| --- | --- | --- | --- |
| Neon Postgres | Lead storage | Owner | `DATABASE_URL` is wrong or the database is down; API returns a generic JSON error |
| Vercel | Hosting | Owner | Environment variables are missing on the host |
| Webhook receiver | `lead.created` notifications | Owner | The URL is down or slow; leads still save, the event is lost |
| Anthropic or OpenAI | Optional AI sorting | Owner | Key is invalid or the call exceeds 4s; keyword rules take over |

### Gotchas

- The public form, status tiles, search and saving all need JavaScript.
- Search only covers the loaded (server-filtered) requests and resets on reload; status and category filters live in the URL, and unsaved note drafts stay local.
- Smoke runs create or edit real rows: `pnpm smoke` keeps one lead, and `pnpm smoke:owner` restores the lead it edits.
- If login seems to do nothing: check `SESSION_SECRET`, `OWNER_EMAIL` and `OWNER_PASSWORD` are all set on the host.

### Known issues

- No rate limiting or honeypot on the public form.
- AI sorting has not been exercised against the live deployment; the live site currently uses the keyword fallback.
- Pagination for `GET /api/leads` is not built; it is capped at 500.

---

## Ownership & links

- Owner & Developer: Melvyn John Paleguin, <https://emjaypaleguin.com/>
- Ask about anything: Melvyn John Paleguin (contact above)
- Docs: `references/DOCUMENTATION.md` (architecture), `references/TODO.md` (tasks), `HANDOFF.md` (run, assumptions and next steps)
