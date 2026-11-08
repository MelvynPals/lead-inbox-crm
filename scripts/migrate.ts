import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { db } from "../src/lib/db";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
async function main() {
const sql = db();
try {
  await sql.unsafe(await readFile("migrations/001_leads.sql", "utf8"));
  console.log("Leads table ready.");
} finally {
  await sql.end();
}
}
main().catch(() => { console.error("Migration failed. Check DATABASE_URL and database access."); process.exitCode = 1; });
