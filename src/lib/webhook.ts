import type { Lead } from "./types";
export async function sendWebhook(lead: Lead) {
  if (!process.env.WEBHOOK_URL) return;
  try {
    const response = await fetch(process.env.WEBHOOK_URL, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "lead.created", lead }), signal: AbortSignal.timeout(1500),
    });
    await response.body?.cancel();
  } catch { /* The saved lead remains successful when delivery fails. */ }
}
