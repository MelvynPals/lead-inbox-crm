import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { cookieName, signSession } from "../src/lib/auth";
import type { Lead } from "../src/lib/types";
import { openBrowser } from "./browser";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const base = process.env.BASE_URL ?? "http://localhost:3000";
async function main() {
  const response = await fetch(`${base}/api/leads`, { headers: { authorization: `Bearer ${process.env.API_TOKEN}` } });
  assert.equal(response.status, 200);
  const { leads }: { leads: Lead[] } = await response.json();
  assert.ok(leads.length > 1, "Run API smoke first; inbox checks need at least two requests.");
  const browser = await openBrowser(base, `${cookieName}=${signSession()}`);
  let hydrationWarning = false;
  const stopConsole = browser.onEvent("Runtime.consoleAPICalled", params => {
    if (params.type === "error" && /hydrat|mismatch/i.test(JSON.stringify(params.args))) hydrationWarning = true;
  });
  let passed = 0;
  const pass = (name: string) => { passed++; console.log(`PASS ${name}`); };
  const setSearch = async (value: string) => {
    await browser.evaluate(`(() => {const el=document.getElementById('inbox-search');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await browser.wait(`document.getElementById('inbox-search').value===${JSON.stringify(value)}`);
    await new Promise(ready => setTimeout(ready, 350));
  };
  const visibleIds = () => browser.evaluate<number[]>('[...document.querySelectorAll("[data-lead-id]")].map(el=>Number(el.dataset.leadId))');
  try {
    await browser.wait('document.querySelector(".compact-toggle") && Object.keys(document.querySelector(".compact-toggle")).some(key=>key.startsWith("__reactProps"))');
    assert.equal(await browser.evaluate('document.querySelector(".editor")===null'), true);
    assert.equal(await browser.evaluate('document.querySelector(".summary-all").getAttribute("aria-pressed")'), "true");
    assert.equal(await browser.evaluate('document.querySelectorAll(".inbox-summary").length'), 1);
    assert.equal(await browser.evaluate('document.querySelector(".filters").textContent.trim()').then(value => String(value).startsWith("Category")), true);
    pass("cards start collapsed; All is active; no duplicate status chip row");
    for (const width of [375, 768, 1024, 1280]) {
      await browser.send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      await browser.wait(`Boolean(document.querySelector('.request-detail-pane'))===${width >= 1024}`);
      assert.equal(await browser.evaluate("document.documentElement.scrollWidth<=innerWidth"), true);
      if (width >= 1024) {
        assert.equal(await browser.evaluate('document.querySelector(".request-detail-pane").textContent.includes("Select a request")'), true);
        assert.equal(await browser.evaluate('Math.round(document.querySelector(".inbox-list-column").getBoundingClientRect().width)'), 420);
        assert.equal(await browser.evaluate('getComputedStyle(document.querySelector(".request-detail-pane")).position'), "sticky");
        const height = await browser.evaluate<number>('document.querySelector(".compact-toggle").getBoundingClientRect().height');
        assert.ok(height >= 120 && height <= 150);
      }
      await browser.evaluate('document.querySelector(".compact-toggle").click()');
      await browser.wait('document.querySelector(".editor")');
      assert.equal(await browser.evaluate('document.querySelectorAll(".compact-toggle[aria-expanded=true]").length'), 1);
      assert.equal(await browser.evaluate('document.querySelectorAll(".editor").length'), 1);
      assert.equal(await browser.evaluate('Boolean(document.querySelector(".request-detail-pane .editor"))'), width >= 1024);
      assert.equal(await browser.evaluate('document.querySelector(".editor select")===null && !document.body.textContent.includes("Last saved note")'), true);
      assert.equal(await browser.evaluate('document.querySelector(".status-pills").children.length'), 4);
      const tooSmall = await browser.evaluate<string[]>('[...document.querySelectorAll("button,a,input:not([type=hidden]),textarea")].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.top>=0&&r.height<43.9}).map(el=>el.tagName)');
      assert.deepEqual(tooSmall, []);
      await browser.evaluate("document.fonts.ready");
      const shot = await browser.send<{ data: string }>("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
      await writeFile(`.taste-skill/compact-inbox-${width}.png`, Buffer.from(shot.data, "base64"));
      await browser.evaluate('document.querySelector(".compact-toggle[aria-expanded=true]").click()');
      await browser.wait('document.querySelector(".editor")===null');
      pass(`${width}px: compact cards, one editor, correct pane, wrapping status pills and 44px targets`);
    }
    await browser.evaluate('document.querySelector(".compact-toggle").focus()');
    await browser.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
    await browser.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await browser.wait('document.querySelector(".editor")');
    await browser.evaluate('document.querySelectorAll(".compact-toggle")[1].click()');
    await browser.wait('document.querySelectorAll(".compact-toggle")[1].getAttribute("aria-expanded")==="true"');
    assert.equal(await browser.evaluate('document.querySelectorAll(".editor").length'), 1);
    pass("keyboard expansion and selecting another request keep a single detail view");
    await browser.evaluate("document.querySelector('.compact-toggle .message-preview').textContent='Long message. '.repeat(80)");
    await browser.wait('document.querySelector(".compact-toggle .read-message-hint")');
    await browser.evaluate("document.querySelector('.compact-toggle .message-preview').textContent='Short.'");
    await browser.wait('document.querySelector(".compact-toggle .read-message-hint")===null');
    pass("Read full message appears only when overflow is measured");
    for (const field of ["name", "email", "phone", "message"] as const) {
      const value = leads.find(lead => lead[field].trim())?.[field].trim();
      if (!value) continue;
      await setSearch(value);
      const expected = leads.filter(lead => [lead.name, lead.email, lead.phone, lead.message].some(text => text.toLocaleLowerCase().includes(value.toLocaleLowerCase()))).map(lead => lead.id);
      await browser.wait(`document.querySelectorAll('[data-lead-id]').length===${expected.length}`);
      assert.deepEqual(await visibleIds(), expected);
      assert.ok(await browser.evaluate(`document.querySelector('.inbox-count').textContent.startsWith(${JSON.stringify(`${expected.length} of ${leads.length} requests`)})`));
      pass(`debounced search matches ${field}`);
    }
    await browser.evaluate('document.querySelector(".search-clear").click()');
    await browser.wait(`document.querySelectorAll('[data-lead-id]').length===${leads.length}`);
    assert.equal(await browser.evaluate('document.getElementById("inbox-search").value'), "");
    pass("clear search restores the list and count");
    const lead = leads[0];
    await browser.evaluate(`document.querySelector('.summary-tile.status-${lead.status}').click()`);
    await browser.wait(`new URLSearchParams(location.search).get('status')===${JSON.stringify(lead.status)} && !document.querySelector('.summary-tile:disabled')`);
    await browser.evaluate(`document.querySelector('.chip-row a[href*="category=${lead.category}"]').click()`);
    await browser.wait(`new URLSearchParams(location.search).get('category')===${JSON.stringify(lead.category)} && document.querySelector('.chip[aria-current=true]').textContent===${JSON.stringify(lead.category[0].toUpperCase() + lead.category.slice(1))}`);
    await setSearch(lead.email.trim());
    const matching = leads.filter(item => item.status === lead.status && item.category === lead.category && [item.name, item.email, item.phone, item.message].some(value => value.toLocaleLowerCase().includes(lead.email.trim().toLocaleLowerCase())));
    await browser.wait(`document.querySelectorAll('[data-lead-id]').length===${matching.length}`);
    assert.deepEqual(await visibleIds(), matching.map(item => item.id));
    await browser.evaluate(`document.querySelector('.summary-tile.status-${lead.status}').click()`);
    await browser.wait('!new URLSearchParams(location.search).has("status") && !document.querySelector(".summary-tile:disabled")');
    assert.equal(await browser.evaluate('new URLSearchParams(location.search).get("category")'), lead.category);
    pass("search combines with URL filters; active summary tile toggles off preserving category");
    await browser.send("Page.navigate", { url: `${base}/dashboard` });
    await browser.wait('document.querySelector(".compact-toggle") && Object.keys(document.querySelector(".compact-toggle")).some(key=>key.startsWith("__reactProps"))');
    await browser.evaluate('document.querySelector(".compact-toggle").click()');
    await browser.wait('document.querySelector(".editor textarea")');
    await browser.evaluate("(() => {const el=document.querySelector('.editor textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'Draft retained locally');el.dispatchEvent(new Event('input',{bubbles:true}));})()");
    await browser.evaluate('document.querySelectorAll(".compact-toggle")[1].click()');
    await browser.evaluate('document.querySelectorAll(".compact-toggle")[0].click()');
    await browser.wait('document.querySelector(".editor textarea").value==="Draft retained locally"');
    await browser.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 1000, deviceScaleFactor: 1, mobile: false });
    await browser.wait('!document.querySelector(".request-detail-pane") && document.querySelector(".editor textarea").value==="Draft retained locally"');
    await browser.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
    await browser.wait('document.querySelector(".request-detail-pane .editor textarea").value==="Draft retained locally"');
    pass("unsaved note drafts survive request selection and viewport changes");
    const originalStatus = await browser.evaluate<string>('document.querySelector(".status-pill[aria-pressed=true]").textContent');
    const unsubscribe = browser.onEvent("Fetch.requestPaused", params => {
      const request = params.request as { method: string };
      void browser.send(request.method === "POST" ? "Fetch.failRequest" : "Fetch.continueRequest", { requestId: params.requestId, ...(request.method === "POST" ? { errorReason: "InternetDisconnected" } : {}) });
    });
    await browser.send("Fetch.enable", { patterns: [{ urlPattern: "*/dashboard*", requestStage: "Request" }] });
    try {
      await browser.evaluate('document.querySelector(".status-pill[aria-pressed=false]").click()');
      await browser.wait('document.querySelector(".toast[role=alert]")');
      assert.equal(await browser.evaluate('document.querySelector(".status-pill[aria-pressed=true]").textContent'), originalStatus);
      assert.equal(await browser.evaluate('document.querySelector(".editor textarea").value'), "Draft retained locally");
    } finally { await browser.send("Fetch.disable"); unsubscribe(); }
    pass("failed status save reverts the selected pill and retains the draft note");
    assert.equal(hydrationWarning, false);
    pass("no hydration mismatch during navigation, resizing and editing");
    console.log(`${passed} inbox checks passed. No requests or notes were saved.`);
  } finally { stopConsole(); await browser.close(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Inbox checks failed."); process.exitCode = 1; });
