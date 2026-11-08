import { existsSync } from "node:fs";
import assert from "node:assert/strict";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
async function main() {
const base = process.env.BASE_URL ?? "http://localhost:3000";
const headers = { authorization: `Bearer ${process.env.API_TOKEN}`, "content-type": "application/json" };
let passed = 0, failed = 0;
async function check(name: string, run: () => Promise<void>) {
  try { await run(); passed++; console.log(`PASS ${name}`); }
  catch { failed++; console.log(`FAIL ${name}`); }
}
async function request(path: string, status: number, init?: RequestInit) {
  const response = await fetch(`${base}/api/leads${path}`, init);
  assert.equal(response.status, status);
  if (status === 204) return response;
  const body = await response.json();
  if (status >= 400) { assert.equal(typeof body.error, "string"); assert.deepEqual(Object.keys(body), ["error"]); }
  return body;
}
const payload = { name: " Smoke test ", email: " Smoke@example.com ", service: "cleaning", message: "Can you come Tuesday?" };
let id: number;
await check("OPTIONS public CORS 204", async () => {
  const response = await request("", 204, { method: "OPTIONS", headers: { origin: "https://example.com", "access-control-request-method": "POST" } });
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
});
await check("POST 201 exact shape, raw text, defaults, ISO UTC, CORS", async () => {
  const response = await fetch(`${base}/api/leads`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, unknown: "ignored" }) });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  const lead = await response.json(); id = lead.id;
  assert.deepEqual(Object.keys(lead).sort(), ["id", "name", "email", "phone", "service", "message", "category", "urgency", "status", "note", "created_at"].sort());
  assert.equal(typeof id, "number");
  for (const [key, value] of Object.entries(payload)) assert.equal(lead[key], value);
  assert.equal(lead.phone, ""); assert.equal(lead.note, ""); assert.equal(lead.status, "new");
  assert.match(lead.created_at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  assert.ok(["booking", "question", "complaint", "other"].includes(lead.category));
  assert.ok(["high", "normal", "low"].includes(lead.urgency));
});
for (const [name, body] of [["malformed JSON", "{"], ["null body", "null"], ["array body", "[]"], ["missing fields", "{}"], ["wrong types", JSON.stringify({ ...payload, name: 5 })], ["blank name", JSON.stringify({ ...payload, name: " " })], ["invalid email", JSON.stringify({ ...payload, email: "bad" })], ["invalid service", JSON.stringify({ ...payload, service: "bad" })], ["long name", JSON.stringify({ ...payload, name: "x".repeat(101) })], ["long phone", JSON.stringify({ ...payload, phone: "x".repeat(31) })], ["long message", JSON.stringify({ ...payload, message: "x".repeat(2001) })]]) {
  await check(`POST ${name} 400`, async () => { await request("", 400, { method: "POST", headers, body }); });
}
for (const method of ["GET", "PATCH"]) for (const path of method === "GET" ? ["", "/abc", "/2147483647"] : ["/abc", "/2147483647"]) {
  for (const authorization of ["", "Bearer wrong"]) await check(`${method} ${path || "list"} ${authorization ? "wrong" : "missing"} token 401`, async () => { await request(path, 401, { method, headers: { authorization } }); });
}
for (const path of ["", "?status=new", "?category=booking", "?status=new&category=booking"]) await check(`GET list ${path} 200, filters/order/cap`, async () => {
  const body = await request(path, 200, { headers });
  assert.deepEqual(Object.keys(body), ["leads"]); assert.ok(body.leads.length <= 500);
  const params = new URLSearchParams(path.slice(1));
  for (let i = 0; i < body.leads.length; i++) {
    const lead = body.leads[i];
    for (const key of ["status", "category"]) if (params.has(key)) assert.equal(lead[key], params.get(key));
    if (i) assert.ok(Date.parse(body.leads[i - 1].created_at) >= Date.parse(lead.created_at));
  }
});
for (const query of ["?status=bad", "?category=bad", "?status=", "?status=new&category=bad"]) await check(`GET ${query} 400`, async () => { await request(query, 400, { headers }); });
await check("GET id 200", async () => { assert.equal((await request(`/${id}`, 200, { headers })).id, id); });
for (const method of ["GET", "PATCH"]) for (const path of ["/abc", "/2147483647", "/99999999999999999999"]) await check(`${method} ${path} 404`, async () => { await request(path, 404, { method, headers, ...(method === "PATCH" ? { body: '{"note":"test"}' } : {}) }); });
for (const patch of [{ status: "contacted" }, { status: "won" }, { status: "lost" }, { status: "new", note: " raw note " }, { note: "replacement" }, { note: "" }]) await check(`PATCH ${JSON.stringify(patch)} 200`, async () => {
  const lead = await request(`/${id}`, 200, { method: "PATCH", headers, body: JSON.stringify(patch) });
  for (const [key, value] of Object.entries(patch)) assert.equal(lead[key], value);
  const saved = await request(`/${id}`, 200, { headers });
  for (const [key, value] of Object.entries(patch)) assert.equal(saved[key], value);
});
for (const body of ["{", "null", "[]", "{}", '{"status":"bad"}', '{"status":3}', '{"note":null}', JSON.stringify({ note: "x".repeat(2001) })]) await check(`PATCH invalid ${body.slice(0, 32)} 400`, async () => { await request(`/${id}`, 400, { method: "PATCH", headers, body }); });
console.log(`${passed} passed; ${failed} failed. One smoke-test lead is retained in the database.`);
process.exitCode = failed ? 1 : 0;
}
main().catch(() => { console.error("Smoke runner failed."); process.exitCode = 1; });
