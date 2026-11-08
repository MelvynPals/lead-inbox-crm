import { test } from "node:test";
import assert from "node:assert/strict";
import { sendWebhook } from "./webhook";
import type { Lead } from "./types";

test("webhook skips when unset and catches a 1500ms abort without losing its payload", async () => {
  const originalFetch = global.fetch;
  const originalTimeout = AbortSignal.timeout;
  const originalUrl = process.env.WEBHOOK_URL;
  const lead: Lead = { id: 1, name: "Test", email: "test@example.com", phone: "", service: "other", message: "Test", category: "other", urgency: "normal", status: "new", note: "", created_at: "2026-11-07T09:30:00Z" };
  let calls = 0;
  let timeout = 0;
  let body: unknown;
  let signal: AbortSignal | undefined;
  try {
    AbortSignal.timeout = milliseconds => { timeout = milliseconds; return originalTimeout(milliseconds); };
    global.fetch = async (_url, options) => {
      calls++;
      body = JSON.parse(String(options?.body));
      signal = options?.signal as AbortSignal;
      return new Promise<Response>((_resolve, reject) => {
        const guard = setTimeout(() => reject(new Error("Abort did not arrive.")), 4000);
        signal!.addEventListener("abort", () => { clearTimeout(guard); reject(signal!.reason); }, { once: true });
      });
    };
    delete process.env.WEBHOOK_URL;
    await sendWebhook(lead);
    assert.equal(calls, 0);
    process.env.WEBHOOK_URL = "https://example.invalid/webhook";
    const started = performance.now();
    await assert.doesNotReject(sendWebhook(lead));
    assert.equal(timeout, 1500);
    assert.equal(signal?.aborted, true);
    assert.ok(performance.now() - started < 3000);
    assert.deepEqual(body, { event: "lead.created", lead });
    assert.equal(calls, 1);
  } finally {
    global.fetch = originalFetch;
    AbortSignal.timeout = originalTimeout;
    if (originalUrl === undefined) delete process.env.WEBHOOK_URL; else process.env.WEBHOOK_URL = originalUrl;
  }
});
