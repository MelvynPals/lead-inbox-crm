import { apiAuthorized } from "@/src/lib/auth";
import { createLead, listLeads } from "@/src/lib/db";
import { cors, error, json, readJson, routeError } from "@/src/lib/http";
import { sortLead } from "@/src/lib/sorting";
import { validateFilters, validateLead } from "@/src/lib/validation";
import { sendWebhook } from "@/src/lib/webhook";

export function OPTIONS() { return new Response(null, { status: 204, headers: cors }); }
export async function POST(request: Request) {
  try {
    const input = validateLead(await readJson(request));
    const lead = await createLead(input, await sortLead(input));
    await sendWebhook(lead);
    return json(lead, 201, true);
  } catch (cause) { return routeError(cause, true); }
}
export async function GET(request: Request) {
  try {
    if (!apiAuthorized(request)) return error("Unauthorized.", 401);
    const query = new URL(request.url).searchParams;
    return json({ leads: await listLeads(validateFilters(query.get("status"), query.get("category"))) });
  } catch (cause) { return routeError(cause); }
}
