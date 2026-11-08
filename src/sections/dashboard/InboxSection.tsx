import Link from "next/link";
import { listLeads } from "@/src/lib/db";
import { statuses, type Lead } from "@/src/lib/types";
import { validateFilters } from "@/src/lib/validation";
import { ClientInbox } from "@/src/components/ClientInbox";

export async function InboxSection({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const status = typeof query.status === "string" && query.status ? query.status : null;
  const category = typeof query.category === "string" && query.category ? query.category : null;
  let leads: Lead[] = [], all: Lead[] = [], issue = "";
  try {
    const filters = validateFilters(status, category);
    [leads, all] = await Promise.all([listLeads(filters), listLeads()]);
  } catch { issue = "We couldn't load your requests. Try again in a moment, or clear your filters."; }
  const counts = Object.fromEntries(statuses.map(value => [value, all.filter(lead => lead.status === value).length]));
  return <section aria-labelledby="inbox-heading"><div className="dashboard-heading"><h1 id="inbox-heading">Your inbox</h1><p className="muted">A little attention makes a big difference. Here&apos;s who needs a hand.</p></div>{issue ? <div className="panel empty-state" role="alert"><p className="error">{issue}</p><Link className="button quiet" href="/dashboard">Clear filters</Link></div> : <ClientInbox leads={leads} total={all.length} counts={counts} status={status} category={category}/>}</section>;
}
