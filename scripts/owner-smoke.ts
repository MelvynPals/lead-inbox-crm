import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import { openBrowser } from "./browser";

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
    const loginBrowser = await openBrowser(base, "lead_owner=invalid");
    try {
      await loginBrowser.wait('document.getElementById("password") && Object.keys(document.getElementById("password")).some(key=>key.startsWith("__reactProps"))');
      assert.equal(await loginBrowser.evaluate('document.getElementById("email").autocomplete'), "username");
      assert.equal(await loginBrowser.evaluate('document.getElementById("password").autocomplete'), "current-password");
      await loginBrowser.evaluate("(() => {const el=document.getElementById('email');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'wrong@example.com');el.dispatchEvent(new Event('input',{bubbles:true}));})()");
      for (let attempt = 0; attempt < 2; attempt++) {
        await loginBrowser.evaluate("(() => {const el=document.getElementById('password');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'wrong-password');el.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('form.stack button').click();})()");
        await loginBrowser.wait('document.querySelector(".error-summary") && document.getElementById("password").value==="" && !document.querySelector("form.stack button").disabled');
        assert.equal(await loginBrowser.evaluate('document.getElementById("email").value'), "wrong@example.com");
      }
    } finally { await loginBrowser.close(); }
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
    assert.ok(dashboard.includes("Your inbox")); assert.ok(dashboard.includes("data-lead-id"));
    assert.ok(!dashboard.includes(process.env.API_TOKEN!));
  });
  let browser: Awaited<ReturnType<typeof openBrowser>> | undefined;
  let testedId: string | undefined;
  await check("owner saves existing lead through shared validation/query", async () => {
    browser = await openBrowser(base, cookie);
    await browser.wait('document.querySelector(".compact-toggle") && Object.keys(document.querySelector(".compact-toggle")).some(key=>key.startsWith("__reactProps"))');
    testedId = await browser.evaluate<string>('document.querySelector("[data-lead-id]").dataset.leadId');
    const headers = { authorization: `Bearer ${process.env.API_TOKEN}` };
    const lead = await (await fetch(`${base}/api/leads/${testedId}`, { headers })).json();
    const note = `Owner smoke verification ${Date.now()}`;
    try {
      await browser.evaluate('document.querySelector(".compact-toggle").click()');
      await browser.wait('document.querySelector(".editor")');
      await browser.evaluate("document.fonts.ready");
      const noteTop = await browser.evaluate<number>('document.querySelector(".editor textarea").getBoundingClientRect().top');
      assert.equal(await browser.evaluate('getComputedStyle(document.querySelector(".editor textarea")).fontWeight'), "400");
      await browser.evaluate('[...document.querySelectorAll(".status-pill")].find(button=>button.textContent==="Contacted").click()');
      await browser.wait('document.querySelector(".status-control").textContent.includes("Saved")');
      assert.equal(await browser.evaluate('document.querySelectorAll(".status-control .save-feedback").length'), 1);
      assert.equal(await browser.evaluate('document.querySelector(".inbox-count").textContent.includes("Saved")'), false);
      assert.ok(Math.abs(await browser.evaluate<number>('document.querySelector(".editor textarea").getBoundingClientRect().top') - noteTop) < 1, "Status feedback must not shift the note editor.");
      await browser.evaluate(`(() => {const el=document.querySelector('.editor textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,${JSON.stringify(note)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
      await browser.evaluate('document.querySelector(".editor button").click()');
      await browser.wait('document.querySelector(".editor [role=status]")?.textContent==="Saved"');
      assert.equal(await browser.evaluate('document.querySelectorAll(".editor .note-feedback").length'), 1);
      assert.ok(Math.abs(await browser.evaluate<number>('document.querySelector(".editor textarea").getBoundingClientRect().top') - noteTop) < 1, "Note feedback must not shift the note editor.");
      assert.equal(await browser.evaluate('Boolean(document.querySelector(".compact-card.is-selected .note-indicator"))'), true);
      const saved = await (await fetch(`${base}/api/leads/${testedId}`, { headers })).json();
      assert.equal(saved.status, "contacted"); assert.equal(saved.note, note);
    } finally {
      const response = await fetch(`${base}/api/leads/${testedId}`, { method: "PATCH", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ status: lead.status, note: lead.note }) });
      assert.equal(response.status, 200);
    }
  });
  await check("owner mutation rejects missing session", async () => {
    assert.ok(browser && testedId);
    await browser.send("Network.clearBrowserCookies");
    await browser.evaluate(`(() => {const el=document.querySelector('.editor textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'must not save');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await browser.evaluate('document.querySelector(".editor button").click()');
    await browser.wait('document.querySelector(".editor [role=alert]")?.textContent.includes("session expired")');
    const saved = await (await fetch(`${base}/api/leads/${testedId}`, { headers: { authorization: `Bearer ${process.env.API_TOKEN}` } })).json();
    assert.notEqual(saved.note, "must not save");
  });
  await browser?.close();
  await check("dashboard filters render for authenticated owner", async () => {
    const response = await fetch(`${base}/dashboard?status=new&category=booking`, { headers: { cookie } });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes('aria-label="Filter by status"'));
    assert.ok(html.includes('aria-label="Filter by category"'));
    assert.ok(html.includes('aria-pressed="true"'));
    assert.ok(!html.includes('class="status-control"'));
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
