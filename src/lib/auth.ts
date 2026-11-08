import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

export function equal(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function apiAuthorized(request: Request) {
  return !!process.env.API_TOKEN && equal(request.headers.get("authorization") ?? "", `Bearer ${process.env.API_TOKEN}`);
}
export const cookieName = "lead_owner";
function signature(payload: string) {
  if (!process.env.SESSION_SECRET) throw new Error("Session secret is not configured.");
  return createHmac("sha256", process.env.SESSION_SECRET).update(payload).digest("base64url");
}
export function signSession() {
  const payload = String(Date.now() + 8 * 60 * 60 * 1000);
  return `${payload}.${signature(payload)}`;
}
export function validSession(token: string | undefined) {
  if (!token || !process.env.SESSION_SECRET) return false;
  const [payload, mac, extra] = token.split(".");
  return !extra && !!mac && /^\d+$/.test(payload) && Number(payload) > Date.now() && equal(mac, signature(payload));
}
export async function ownerAuthorized() {
  await connection();
  return validSession((await cookies()).get(cookieName)?.value);
}
