# Lead Inbox implementation

Next.js 16 App Router, React, TypeScript, Tailwind CSS and postgres.js. Node 22+ is required for script environment loading.

API routes are in `app/api/leads/`; shared validation, queries, sorting, webhook, auth and HTTP helpers are in `src/lib/`. `migrations/001_leads.sql` creates the leads table and newest-first index. Run it with `pnpm db:migrate`; it is safe to rerun.

The table has a serial integer ID, raw text input fields, checked enum columns, empty phone/note defaults, a new status default, and a timestamptz creation time. Queries use parameters and format timestamps as UTC without milliseconds. Lists are capped at 500.

Environment: DATABASE_URL is the Neon Postgres URL; API_TOKEN protects API reads and updates; WEBHOOK_URL is optional notification delivery; OWNER_EMAIL/OWNER_PASSWORD are owner credentials; SESSION_SECRET signs owner sessions. ANTHROPIC_API_KEY and OPENAI_API_KEY are optional, with Anthropic preferred if both are present. No environment values are logged or exposed in client components.

Sorting precedence: complaint, booking, question, other. Complaints and urgent/asap/emergency/today/leak/flood are high. Questions without time words are low. All other messages are normal. AI classification uses strict schema output and a four-second timeout; invalid responses and failures use keyword rules.

Commands: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm test`, `pnpm smoke`, `pnpm db:migrate`. Smoke uses BASE_URL (default http://localhost:3000) and API_TOKEN, loads `.env.local` if present, creates one retained lead and performs the normal webhook call. Deploy with Vercel's Next.js preset after migrating Neon; hosting and secrets are managed by the owner.

Pages compose server sections from `src/sections/`; interactive forms/editors are client leaves in `src/components/`. `/dashboard` reads from Postgres server-side after verifying the owner cookie. Server actions in `app/actions.ts` sign in, sign out and save edits with shared PATCH validation/queries. Session cookies use HMAC-SHA256, expire after eight hours, are httpOnly and SameSite=Lax, and Secure in production. Authentication explicitly waits for a request before checking expiry. Filters use a GET form; no API token reaches the browser. Dates display in UTC.

`pnpm smoke:owner` checks rendered forms, bad/good login, session forgery, protected data, session-gated saves, filters and logout. It tests one existing lead, then restores its original values. It never prints configured credentials. Headless browser review snapshots stay ignored under `.taste-skill/`.
