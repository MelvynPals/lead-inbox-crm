import postgres from "postgres";
import type { Lead, LeadInput, LeadPatch, Sorting } from "./types";

let client: ReturnType<typeof postgres> | undefined;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
  return client ??= postgres(process.env.DATABASE_URL, { max: 3, idle_timeout: 20, connect_timeout: 10, prepare: false });
}
const columns = "id, name, email, phone, service, message, category, urgency, status, note, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS created_at";
export async function createLead(input: LeadInput, sorting: Sorting): Promise<Lead> {
  const sql = db();
  const [lead] = await sql<Lead[]>`INSERT INTO leads ${sql({ ...input, ...sorting })} RETURNING ${sql.unsafe(columns)}`;
  return lead;
}
export async function listLeads(filters: { status: string | null; category: string | null } = { status: null, category: null }) {
  const sql = db();
  return sql<Lead[]>`SELECT ${sql.unsafe(columns)} FROM leads WHERE (${filters.status}::text IS NULL OR status = ${filters.status}) AND (${filters.category}::text IS NULL OR category = ${filters.category}) ORDER BY created_at DESC, id DESC LIMIT 500`;
}
export async function getLead(id: number) {
  const sql = db();
  const [lead] = await sql<Lead[]>`SELECT ${sql.unsafe(columns)} FROM leads WHERE id = ${id}`;
  return lead;
}
export async function updateLead(id: number, patch: LeadPatch) {
  const sql = db();
  const [lead] = await sql<Lead[]>`UPDATE leads SET ${sql(patch)} WHERE id = ${id} RETURNING ${sql.unsafe(columns)}`;
  return lead;
}
