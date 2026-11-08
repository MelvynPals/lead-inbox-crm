import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { openBrowser } from "./browser";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const base = process.env.BASE_URL ?? "http://localhost:3000";
async function main() {
  const browser = await openBrowser(base, "lead_owner=invalid");
  try {
    await browser.wait('document.getElementById("password")');
    const unsubscribe = browser.onEvent("Fetch.requestPaused", params => {
      void browser.send("Fetch.fulfillRequest", { requestId: params.requestId, responseCode: 201, responseHeaders: [{ name: "content-type", value: "application/json" }], body: Buffer.from('{"id":1}').toString("base64") });
    });
    await browser.send("Fetch.enable", { patterns: [{ urlPattern: "*/api/leads", requestStage: "Request" }] });
    try {
      for (const width of [375, 1280]) {
        await browser.send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: false });
        await browser.send("Page.navigate", { url: base });
        await browser.wait('document.querySelector("form.panel") && Object.keys(document.querySelector("form.panel")).some(key=>key.startsWith("__reactProps"))');
        await browser.evaluate("document.fonts.ready");
        await browser.evaluate("(() => {for(const [id,value] of [['name','Alex Example'],['email','alex@example.com'],['message','Please help with cleaning.']]){const el=document.getElementById(id);const prototype=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));}document.querySelector('[name=service][value=cleaning]').click();document.querySelector('form.panel').requestSubmit();})()");
        await browser.wait('document.querySelector(".confirmation")');
        const gap = await browser.evaluate<number>("(() => {const card=document.querySelector('.confirmation');return card.getBoundingClientRect().bottom-card.lastElementChild.getBoundingClientRect().bottom-parseFloat(getComputedStyle(card).paddingBottom)-1})()");
        assert.ok(Math.abs(gap) < 1, "Success card must end at its content plus padding.");
        assert.equal(await browser.evaluate("document.documentElement.scrollWidth<=innerWidth"), true);
        console.log(`PASS ${width}px success card fits content without empty bottom space`);
      }
    } finally { await browser.send("Fetch.disable"); unsubscribe(); }
    console.log("2 polish checks passed. Form responses mocked; no leads created.");
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Polish smoke failed."); process.exitCode = 1; });
