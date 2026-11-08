"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookieName, equal, ownerAuthorized, signSession } from "@/src/lib/auth";
import { updateLead } from "@/src/lib/db";
import { InputError, leadId, validatePatch } from "@/src/lib/validation";

export async function login(_previous: { error: string }, form: FormData) {
  const email = form.get("email"), password = form.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !process.env.OWNER_EMAIL || !process.env.OWNER_PASSWORD || !equal(email, process.env.OWNER_EMAIL) || !equal(password, process.env.OWNER_PASSWORD)) return { error: "Email or password is incorrect." };
  if (!process.env.SESSION_SECRET) return { error: "Owner login is not configured. Please contact the owner." };
  (await cookies()).set(cookieName, signSession(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 });
  redirect("/dashboard");
}
export async function logout() { (await cookies()).delete(cookieName); redirect("/login"); }
export async function saveLead(id: number, _previous: { error: string; saved: boolean }, form: FormData) {
  if (!await ownerAuthorized()) return { error: "Your session expired. Sign in again to save changes.", saved: false };
  try {
    const parsedId = leadId(String(id));
    if (parsedId === null) return { error: "Lead not found.", saved: false };
    const lead = await updateLead(parsedId, validatePatch({ status: form.get("status"), note: form.get("note") }));
    if (!lead) return { error: "Lead not found.", saved: false };
    revalidatePath("/dashboard");
    return { error: "", saved: true };
  } catch (cause) { return { error: cause instanceof InputError ? cause.message : "Unable to save changes. Please try again.", saved: false }; }
}
