import Link from "next/link";
import { Inbox, Mail, Phone, SlidersHorizontal } from "lucide-react";
import { categories, statuses, type Lead } from "@/src/lib/types";
import { listLeads } from "@/src/lib/db";
import { validateFilters } from "@/src/lib/validation";
import { LeadEditor } from "@/src/components/LeadEditor";
import { LeadTime } from "@/src/components/LeadTime";
import { LeadMessage } from "@/src/components/LeadMessage";

function href(status: string | null, category: string | null) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (category) query.set("category", category);
  return `/dashboard${query.size ? `?${query}` : ""}`;
}
const title = (value: string) => value[0].toUpperCase() + value.slice(1);
export async function InboxSection({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const status = typeof query.status === "string" && query.status ? query.status : null;
  const category = typeof query.category === "string" && query.category ? query.category : null;
  let leads: Lead[] = [], all: Lead[] = [], issue = "";
  try {
    const filters = validateFilters(status, category);
    [leads, all] = await Promise.all([listLeads(filters), listLeads()]);
  } catch { issue = "We couldn't load your requests. Try again in a moment, or clear your filters."; }
  return <section aria-labelledby="inbox-heading"><div className="dashboard-heading"><h1 id="inbox-heading">Your inbox</h1><p className="muted">A little attention makes a big difference. Here&apos;s who needs a hand.</p></div><div className="summary-grid" aria-label="Requests by status">{statuses.map(value => <Link href={href(status === value ? null : value, category)} className={`summary-tile status-${value}`} aria-current={status === value ? "true" : undefined} key={value}><span className="summary-label"><span className="status-dot"/>{title(value)}</span><strong>{issue ? "-" : all.filter(lead => lead.status === value).length}</strong></Link>)}</div><div className="filters" aria-label="Filter requests"><div className="filter-group"><span className="filter-label">Status</span><nav className="chip-row" aria-label="Filter by status">{["", ...statuses].map(value => <Link className="chip" aria-current={(status ?? "") === value ? "true" : undefined} href={href(value || null, category)} key={value}>{value ? title(value) : "All"}</Link>)}</nav></div><div className="filter-group"><span className="filter-label">Category</span><nav className="chip-row" aria-label="Filter by category">{["", ...categories].map(value => <Link className="chip" aria-current={(category ?? "") === value ? "true" : undefined} href={href(status, value || null)} key={value}>{value ? title(value) : "All"}</Link>)}</nav></div></div><p className="inbox-count muted">{issue ? "" : `${leads.length} ${leads.length === 1 ? "request" : "requests"} \u00b7 Newest first`}{all.length === 500 && " \u00b7 Counts reflect the latest 500 requests"}</p>{issue ? <div className="panel empty-state" role="alert"><p className="error">{issue}</p><Link className="button quiet" href="/dashboard">Clear filters</Link></div> : !leads.length ? <div className="panel empty-state">{status || category ? <SlidersHorizontal size={32} aria-hidden="true"/> : <Inbox size={32} aria-hidden="true"/>}<h2>{status || category ? "No matches just yet." : "A fresh start for your inbox."}</h2><p className="muted">{status || category ? "Try a different filter to find the request you're looking for." : "When a neighbor sends a request, you'll find it right here."}</p>{(status || category) && <Link className="button quiet" href="/dashboard">Clear filters</Link>}</div> : <div className="lead-list">{leads.map(lead => <article className="lead" key={lead.id}><div className="lead-content"><div className="lead-top"><div><h2 className="lead-name">{lead.name}</h2><p className="muted">{title(lead.service)} request</p></div><LeadTime value={lead.created_at}/></div><div className="badges"><span className={`badge status-${lead.status}`}>{title(lead.status)}</span><span className="badge">{title(lead.category)}</span><span className={`badge ${lead.urgency}`}><span className="status-dot"/>{title(lead.urgency)} urgency</span></div><LeadMessage message={lead.message}/><div className="contact-links"><a href={`mailto:${lead.email.trim()}`}><Mail size={17} aria-hidden="true"/>{lead.email}</a>{lead.phone && <a href={`tel:${lead.phone.trim()}`}><Phone size={17} aria-hidden="true"/>{lead.phone}</a>}</div></div><LeadEditor lead={lead}/></article>)}</div>}</section>;
}
