import { existsSync } from "node:fs";
import assert from "node:assert/strict";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const base = process.env.BASE_URL ?? "http://localhost:3000";
let passed = 0, failed = 0;
async function check(name: string, run: () => Promise<void>) {
  try { await run(); passed++; console.log(`PASS ${name}`); }
  catch (cause) { failed++; console.log(`FAIL ${name}: ${cause instanceof Error ? cause.message : "unexpected error"}`); }
}
function form(html: string, marker: string) {
  const markup = html.match(/<form\b[\s\S]*?<\/form>/g)?.find(value => value.includes(marker));
  assert.ok(markup);
  const data = new FormData();
  for (const tag of markup.match(/<input[^>]*type="hidden"[^>]*>/g) ?? []) {
    const name = tag.match(/name="([^"]+)"/)?.[1];
    const value = (tag.match(/value="([^"]*)"/)?.[1] ?? "").replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll("&#x27;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
    if (name) data.set(name, value);
  }
  return data;
}
async function main() {
  await check("public page and form fields 200", async () => {
    const response = await fetch(base); assert.equal(response.status, 200);
    const html = await response.text();
    for (const field of ["name", "email", "phone", "service", "message"]) assert.ok(html.includes(`name="${field}"`));
  });
  await check("dashboard redirects unauthenticated owner", async () => {
    const response = await fetch(`${base}/dashboard`, { redirect: "manual" });
    const html = await response.text();
    assert.ok(response.headers.get("location") === "/login" || html.includes("NEXT_REDIRECT;replace;/login;"));
    assert.ok(!html.includes("Private note"));
  });
  await check("forged session cannot read dashboard", async () => {
    const response = await fetch(`${base}/dashboard`, { headers: { cookie: "lead_owner=9999999999999.forged" }, redirect: "manual" });
    assert.ok(!(await response.text()).includes("Private note"));
  });
  const loginHtml = await (await fetch(`${base}/login`)).text();
  await check("wrong owner credentials show error", async () => {
    const data = form(loginHtml, 'name="password"'); data.set("email", "wrong@example.com"); data.set("password", "wrong");
    const response = await fetch(`${base}/login`, { method: "POST", headers: { origin: base }, body: data, redirect: "manual" });
    assert.ok((await response.text()).includes("Email or password is incorrect."));
    assert.ok(!response.headers.get("set-cookie"));
  });
  let cookie = "";
  await check("correct owner login issues httpOnly SameSite signed session", async () => {
    const data = form(loginHtml, 'name="password"');
    data.set("email", process.env.OWNER_EMAIL ?? ""); data.set("password", process.env.OWNER_PASSWORD ?? "");
    const response = await fetch(`${base}/login`, { method: "POST", headers: { origin: base }, body: data, redirect: "manual" });
    assert.equal(response.status, 303); assert.equal(response.headers.get("location"), "/dashboard");
    const header = response.headers.get("set-cookie") ?? "";
    assert.match(header, /HttpOnly/i); assert.match(header, /SameSite=lax/i);
    cookie = header.split(";")[0]; assert.ok(cookie.startsWith("lead_owner="));
  });
  let dashboard = "";
  await check("signed session reads dashboard without browser API token", async () => {
    const response = await fetch(`${base}/dashboard`, { headers: { cookie } });
    assert.equal(response.status, 200); dashboard = await response.text();
    assert.ok(dashboard.includes("Your inbox")); assert.ok(dashboard.includes("Private note"));
    assert.ok(!dashboard.includes(process.env.API_TOKEN!));
  });
  await check("owner saves existing lead through shared validation/query", async () => {
    const data = form(dashboard, "Private note");
    const markup = dashboard.match(/<form\b[\s\S]*?<\/form>/g)?.find(value => value.includes("Private note")) ?? "";
    const id = markup.match(/id="note-(\d+)"/)?.[1]; assert.ok(id);
    const headers = { authorization: `Bearer ${process.env.API_TOKEN}` };
    const lead = await (await fetch(`${base}/api/leads/${id}`, { headers })).json();
    const note = `Owner smoke verification ${Date.now()}`;
    data.set("status", "contacted"); data.set("note", note);
    try {
      const response = await fetch(`${base}/dashboard`, { method: "POST", headers: { cookie, origin: base }, body: data });
      assert.equal(response.status, 200);
      const result = await response.text();
      assert.ok(!result.includes("Unable to save changes."));
      const saved = await (await fetch(`${base}/api/leads/${id}`, { headers })).json();
      assert.equal(saved.status, "contacted"); assert.equal(saved.note, note);
    } finally {
      const response = await fetch(`${base}/api/leads/${id}`, { method: "PATCH", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ status: lead.status, note: lead.note }) });
      assert.equal(response.status, 200);
    }
  });
  await check("owner mutation rejects missing session", async () => {
    const data = form(dashboard, "Private note"); data.set("status", "won"); data.set("note", "must not save");
    const response = await fetch(`${base}/dashboard`, { method: "POST", headers: { origin: base }, body: data });
    const html = await response.text(); assert.ok(!html.includes("Changes saved."));
    assert.ok(html.includes("session expired") || html.includes("NEXT_REDIRECT"));
  });
  await check("dashboard filters render for authenticated owner", async () => {
    const response = await fetch(`${base}/dashboard?status=new&category=booking`, { headers: { cookie } });
    assert.equal(response.status, 200); assert.ok((await response.text()).includes("Apply filters"));
  });
  await check("logout clears owner cookie", async () => {
    const data = form(dashboard, "Sign out");
    const response = await fetch(`${base}/dashboard`, { method: "POST", headers: { cookie, origin: base }, body: data, redirect: "manual" });
    assert.equal(response.status, 303); assert.equal(response.headers.get("location"), "/login");
    assert.match(response.headers.get("set-cookie") ?? "", /lead_owner=;/);
  });
  console.log(`${passed} passed; ${failed} failed. No new leads created.`);
  process.exitCode = failed ? 1 : 0;
}
main().catch(() => { console.error("Owner smoke runner failed."); process.exitCode = 1; });
