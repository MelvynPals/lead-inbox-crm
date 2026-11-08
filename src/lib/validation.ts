import { categories, services, statuses, type LeadInput, type LeadPatch } from "./types";

export class InputError extends Error {}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("Body must be a JSON object.");
  return value as Record<string, unknown>;
}
export function fieldErrors(value: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  for (const [key, max, required] of [["name", 100, true], ["email", Infinity, true], ["phone", 30, false], ["message", 2000, true]] as const) {
    const text = value[key];
    if (text === undefined && !required) continue;
    if (typeof text !== "string") errors[key] = `${key} must be text.`;
    else if (required && !text.trim()) errors[key] = `Please enter your ${key}.`;
    else if (text.trim().length > max) errors[key] = `${key} must be ${max} characters or fewer.`;
  }
  if (typeof value.email === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) errors.email = "Please enter a valid email address.";
  if (!services.includes(value.service as LeadInput["service"])) errors.service = "Please choose a service.";
  return errors;
}
export function validateLead(value: unknown): LeadInput {
  const data = object(value);
  const errors = fieldErrors(data);
  if (Object.keys(errors).length) throw new InputError(Object.values(errors).join(" "));
  return { name: data.name as string, email: data.email as string, phone: data.phone === undefined ? "" : data.phone as string, service: data.service as LeadInput["service"], message: data.message as string };
}
export function validatePatch(value: unknown): LeadPatch {
  const data = object(value);
  const patch: LeadPatch = {};
  if ("status" in data) {
    if (!statuses.includes(data.status as LeadPatch["status"] & string)) throw new InputError("Invalid status.");
    patch.status = data.status as LeadPatch["status"];
  }
  if ("note" in data) {
    if (typeof data.note !== "string" || data.note.trim().length > 2000) throw new InputError("note must be text, up to 2000 characters.");
    patch.note = data.note;
  }
  if (!Object.keys(patch).length) throw new InputError("Provide status and/or note.");
  return patch;
}
export function validateFilters(status: string | null, category: string | null) {
  if (status !== null && !statuses.includes(status as typeof statuses[number])) throw new InputError("Invalid status filter.");
  if (category !== null && !categories.includes(category as typeof categories[number])) throw new InputError("Invalid category filter.");
  return { status, category };
}
export function leadId(id: string) {
  const number = Number(id);
  return /^\d+$/.test(id) && Number.isSafeInteger(number) && number > 0 && number <= 2147483647 ? number : null;
}
