import { categories, statuses, type Lead } from "@/src/lib/types";
import { listLeads } from "@/src/lib/db";
import { validateFilters } from "@/src/lib/validation";
import { LeadEditor } from "@/src/components/LeadEditor";

export async function InboxSection({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  const query = await searchParams;
  const status = typeof query.status === "string" && query.status ? query.status : null;
  const category = typeof query.category === "string" && query.category ? query.category : null;
  let leads: Lead[] = [], issue = "";
  try { leads = await listLeads(validateFilters(status, category)); }
  catch { issue = "Unable to load this inbox. Check your filters or try again shortly."; }
  return <section><div className="toolbar"><div className="stack"><h1>Your inbox</h1><p className="muted">{issue ? "Service requests" : `${leads.length} ${leads.length === 1 ? "request" : "requests"}`} · Newest first</p></div><form className="filters" action="/dashboard"><label htmlFor="status">Status<select id="status" name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{statuses.map(value => <option key={value}>{value}</option>)}</select></label><label htmlFor="category">Category<select id="category" name="category" defaultValue={category ?? ""}><option value="">All categories</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label><button className="quiet">Apply filters</button></form></div>{issue ? <div className="panel" role="alert"><p className="error">{issue}</p></div> : <div className="lead-list">{!leads.length && <div className="panel"><h2>No requests here yet.</h2><p className="muted">New service requests will appear here. Try another filter if you’re looking for an existing lead.</p></div>}{leads.map(lead => <article className="lead" key={lead.id}><div className="lead-content"><div className="lead-top"><div><h2>{lead.name}</h2><p className="muted">{lead.service} request · #{lead.id}</p></div><time className="muted" dateTime={lead.created_at}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(lead.created_at))} UTC</time></div><div className="badges"><span className="badge">{lead.category}</span><span className={`badge ${lead.urgency}`}>{lead.urgency} urgency</span><span className="badge">{lead.status}</span></div><p className="message">{lead.message}</p><div><p><a href={`mailto:${lead.email.trim()}`}>{lead.email}</a></p>{lead.phone && <p className="muted">{lead.phone}</p>}</div></div><LeadEditor lead={lead}/></article>)}</div>}</section>;
}
