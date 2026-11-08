import { apiAuthorized } from "@/src/lib/auth";
import { getLead, updateLead } from "@/src/lib/db";
import { error, json, readJson, routeError } from "@/src/lib/http";
import { leadId, validatePatch } from "@/src/lib/validation";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  try {
    if (!apiAuthorized(request)) return error("Unauthorized.", 401);
    const id = leadId((await context.params).id);
    if (id === null) return error("Lead not found.", 404);
    const lead = await getLead(id);
    return lead ? json(lead) : error("Lead not found.", 404);
  } catch (cause) { return routeError(cause); }
}
export async function PATCH(request: Request, context: Context) {
  try {
    if (!apiAuthorized(request)) return error("Unauthorized.", 401);
    const id = leadId((await context.params).id);
    if (id === null) return error("Lead not found.", 404);
    const lead = await updateLead(id, validatePatch(await readJson(request)));
    return lead ? json(lead) : error("Lead not found.", 404);
  } catch (cause) { return routeError(cause); }
}
