# Lead Inbox

A public service-request form and private owner inbox built with Next.js App Router, TypeScript, Tailwind CSS and Postgres.

Use Node 22+ and pnpm:

```sh
pnpm install
# Copy .env.example to .env.local and fill in the values.
pnpm db:migrate
pnpm dev
```

Open `/` to send a request and `/login` to manage leads.

```sh
pnpm test
pnpm lint
pnpm build
pnpm start
pnpm smoke
pnpm smoke:owner
```

Smoke tests use `BASE_URL` (default `http://localhost:3000`) and the credentials from the environment. The API smoke creates one lead and performs normal webhook delivery. The owner smoke updates an existing lead and restores its original values.

See [HANDOFF.md](HANDOFF.md) for environment variables, deployment, assumptions, verification and limits. See [references/DOCUMENTATION.md](references/DOCUMENTATION.md) for implementation notes.
