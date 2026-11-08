import { InputError } from "./validation";
export const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" };
export function json(body: unknown, status = 200, publicRoute = false) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...(publicRoute ? cors : {}) } });
}
export function error(message: string, status: number, publicRoute = false) { return json({ error: message }, status, publicRoute); }
export async function readJson(request: Request) {
  try { return await request.json(); } catch { throw new InputError("Malformed JSON body."); }
}
export function routeError(cause: unknown, publicRoute = false) {
  return cause instanceof InputError ? error(cause.message, 400, publicRoute) : error("Unable to complete the request. Please try again.", 500, publicRoute);
}
