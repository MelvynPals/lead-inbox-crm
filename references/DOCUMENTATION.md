# Lead Inbox implementation

Next.js 16 App Router, React, TypeScript, Tailwind CSS and postgres.js. Node 22+ is required for script environment loading.

The warm UI uses CSS design tokens in `app/globals.css`, Fraunces headings and Nunito Sans UI loaded by `next/font`. Sample business copy lives in `src/content/business.ts`.

Dark clay button hover states explicitly use white foregrounds, including inherited icon colors. Quiet buttons retain ink on their light hover background; text actions and toast dismiss buttons keep their primary/error foreground on transparent backgrounds.

`pnpm-workspace.yaml` records dependency build approvals. `esbuild` is approved via `pnpm approve-builds`; `sharp` and `unrs-resolver` remain disabled.

The public form uses native service radios styled as cards, submitting the same four service enum values. Client validation still calls the shared validation module. Its message counter is informational and does not impose a different raw-text length rule. The shared header uses the Brightside sample business name and home/sun mark. Business name, tagline, contact line and trust copy live in `src/content/business.ts`.

API routes are in `app/api/leads/`; shared validation, queries, sorting, webhook, auth and HTTP helpers are in `src/lib/`. `migrations/001_leads.sql` creates the leads table and newest-first index. Run it with `pnpm db:migrate`; it is safe to rerun.

`InboxSection` retains server-side auth/data access and existing queries. Its interactive leaf, `ClientInbox`, receives serializable lead/count/filter props. All/status summary buttons use `aria-pressed` and URL navigation; category links retain the status. The duplicate status chip row is removed. Search is a 250ms debounced, case-insensitive substring match over name/email/phone/message within the loaded, server-filtered list. It has an immediate clear action and never calls a search API. Search text stays local; filters persist in the URL.

Each compact card is a native toggle button with `aria-expanded`. It shows two-line previews, status edge/pill, category tint, high urgency only, relative time and a saved-note indicator. `LeadMessage` uses ResizeObserver and font readiness to measure overflow before rendering Read full message. A single selected ID controls expansion. At 1024px the list is 420px wide with one sticky, vertically scrollable detail pane; smaller layouts expand the selected detail in place. A shared local draft map retains unsaved notes across selection and viewport changes.

`LeadEditor` retains the original `saveLead` action: optimistic status pill buttons submit the last saved note so a draft is not accidentally saved; notes have an explicit submit button. A failed status save restores the server value and shows an accessible error toast. Each action uses one reserved feedback slot next to its own controls; the count line has no Saved indicator. The last-saved-note display is removed.

The table has a serial integer ID, raw text input fields, checked enum columns, empty phone/note defaults, a new status default, and a timestamptz creation time. Queries use parameters and format timestamps as UTC without milliseconds. Lists are capped at 500.

Environment: DATABASE_URL is the Neon Postgres URL; API_TOKEN protects API reads and updates; WEBHOOK_URL is optional notification delivery; OWNER_EMAIL/OWNER_PASSWORD are owner credentials; SESSION_SECRET signs owner sessions. ANTHROPIC_API_KEY and OPENAI_API_KEY are optional, with Anthropic preferred if both are present. No environment values are logged or exposed in client components.

Sorting precedence: complaint, booking, question, other. Complaints and urgent/asap/emergency/today/leak/flood are high. Questions without time words are low. All other messages are normal. AI classification uses strict schema output and a four-second timeout; invalid responses and failures use keyword rules.

Commands: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm test`, `pnpm smoke`, `pnpm db:migrate`. Smoke uses BASE_URL (default http://localhost:3000) and API_TOKEN, loads `.env.local` if present, creates one retained lead and performs the normal webhook call. Deploy with Vercel's Next.js preset after migrating Neon; hosting and secrets are managed by the owner.

Pages compose server sections from `src/sections/`; interactive forms/editors are client leaves in `src/components/`. `/dashboard` reads from Postgres server-side after verifying the owner cookie. Server actions in `app/actions.ts` sign in, sign out and save edits with shared PATCH validation/queries. Session cookies use HMAC-SHA256, expire after eight hours, are httpOnly and SameSite=Lax, and Secure in production. Authentication explicitly waits for a request before checking expiry. Filters use URL links; no API token reaches the browser. `LeadTime` renders local full timestamps with timezone labels and relative ages after hydration, refreshing each minute. API timestamps remain unchanged. Summary counts use the newest 500 leads, while the selected filters use the existing filtered query. Skeleton cards render while the owner page streams.

`pnpm smoke:owner` checks rendered forms, bad/good login, session forgery, protected data, session-gated saves, filters and logout. It opens the real collapsed editor in headless Chrome/Edge for saving and session rejection, tests one existing lead, then restores its original values. `pnpm smoke:inbox` checks responsive panes, compact cards, keyboard activation, measured clamping, search/filter composition, drafts and failed-save recovery without saving data. Both use `scripts/browser.ts`; set optional test-only CHROME_PATH if the browser is outside a standard path. API_TOKEN remains in Node, never browser code. Browser profiles and screenshots stay ignored under `.taste-skill/`.

Polish: webhook delivery now uses a 1500ms timeout and still catches every failure after saving. Filter tiles use router.push with scroll:false and category/clear-filter links use scroll={false}; a selected request remains open while it matches. Detail headers include category and urgency badges. Login preserves controlled email state, clears only the password after failure and retains username/current-password autocomplete. Inputs and note text use regular weight; the success card aligns to its own content height. Root HTML suppresses hydration warnings for extension-injected root attributes only. `pnpm smoke:polish` checks success-card sizing at mobile/desktop widths with mocked submissions.
