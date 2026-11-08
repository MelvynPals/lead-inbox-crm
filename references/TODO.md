# Progress

Done: Postgres migration; exact lead API; validation/auth; sorting/fallback; awaited webhook; public form; owner login/dashboard; API and owner smoke tests; production build.
Left: owner-managed deployment and real-phone check.
Current UI redesign: warm tokens and next/font foundation complete; public form, owner pages and full verification in progress.
Blocked: none. Deployment and production environment setup belong to the owner.

- [x] Read BRIEF.md fully and preserve API contract.
- [x] Add query layer, migration, environment template.
- [x] Implement POST/list/detail/PATCH and error/CORS handling.
- [x] Add sorting rules, strict AI output, fallback tests.
- [x] Add webhook timeout and failure isolation.
- [x] Add and run API contract smoke tests.
- [x] Build public form and success/errors.
- [x] Build signed owner login, protected dashboard, filters, status/note editor.
- [x] Verify production build and mobile layout.
- [x] Finish handoff and validation report.
- [x] Record esbuild approval from `pnpm approve-builds` for dependency installation.
- [x] Remove header icon, pair phone/service, and add a styled desktop service selector with Lucide icons and native mobile fallback.
- [x] Share the responsive dropdown across dashboard filters and lead status editing, preserving empty filter values and standard form submission.
- [x] Prevent dropdown label wrapping and allow popups to grow to fit the selected checkmark.
- [ ] Owner: configure Vercel and run live smoke tests.
- [ ] Owner: check on a real phone.
