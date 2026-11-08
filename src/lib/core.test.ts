import { test } from "node:test";
import assert from "node:assert/strict";
import { keywordSort, sortLead } from "./sorting";
import { leadId, validateFilters, validateLead, validatePatch } from "./validation";
import { signSession, validSession } from "./auth";
import { sendWebhook } from "./webhook";

const input = { name: " Ana ", email: " ANA@example.com ", service: "cleaning", message: " Can you come Tuesday? " };
test("validation preserves raw text and defaults; ignores extra fields", () => {
  assert.deepEqual(validateLead({ ...input, extra: true }), { ...input, phone: "" });
  assert.equal(validateLead({ ...input, name: ` ${"a".repeat(100)} ` }).name.length, 102);
  for (const bad of [null, [], 4, { ...input, name: " " }, { ...input, email: "bad" }, { ...input, phone: null }, { ...input, service: "bad" }, { ...input, message: 5 }, { ...input, name: "a".repeat(101) }]) assert.throws(() => validateLead(bad));
});
test("patch, filter and id boundaries", () => {
  assert.deepEqual(validatePatch({ note: "", extra: 2 }), { note: "" });
  assert.deepEqual(validatePatch({ status: "won", note: " raw " }), { status: "won", note: " raw " });
  for (const bad of [{}, [], { status: "bad" }, { note: null }, { note: "a".repeat(2001) }]) assert.throws(() => validatePatch(bad));
  assert.throws(() => validateFilters("", null));
  assert.throws(() => validateFilters(null, "bad"));
  assert.deepEqual(validateFilters("new", "booking"), { status: "new", category: "booking" });
  for (const id of ["no", "-1", "1.5", "999999999999999999", "1e2", "0"]) assert.equal(leadId(id), null);
});
test("keyword categories, precedence and urgency", () => {
  for (const [message, category, urgency] of [
    ["Refund please, book today", "complaint", "high"], ["Can you come Tuesday?", "booking", "normal"],
    ["What is the price?", "question", "low"], ["Emergency leak", "other", "high"],
    ["Hello there", "other", "normal"], ["How much for tomorrow?", "question", "normal"],
  ]) assert.deepEqual(keywordSort(message), { category, urgency });
});
test("sessions reject tampering and expiry", () => {
  process.env.SESSION_SECRET = "unit-test-secret";
  const token = signSession();
  assert.equal(validSession(token), true);
  assert.equal(validSession(`${token}x`), false);
  assert.equal(validSession("1.invalid"), false);
  assert.equal(validSession(undefined), false);
});
test("AI failures and invalid output fall back; webhook errors do not escape", async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalHook = process.env.WEBHOOK_URL;
  process.env.OPENAI_API_KEY = "test";
  process.env.WEBHOOK_URL = "https://example.invalid/hook";
  try {
    global.fetch = async () => { throw new Error("offline"); };
    assert.deepEqual(await sortLead(validateLead(input)), keywordSort(input.message));
    await assert.doesNotReject(sendWebhook({ ...validateLead(input), ...keywordSort(input.message), id: 1, status: "new", note: "", created_at: "2026-11-07T09:30:00Z" }));
    global.fetch = async () => Response.json({ choices: [{ message: { content: '{"category":"invalid","urgency":"high"}' } }] });
    assert.deepEqual(await sortLead(validateLead(input)), keywordSort(input.message));
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
    if (originalHook === undefined) delete process.env.WEBHOOK_URL; else process.env.WEBHOOK_URL = originalHook;
  }
});
