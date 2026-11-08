"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { Inbox, Mail, Phone, Search, StickyNote, X } from "lucide-react";
import { categories, statuses, type Lead } from "@/src/lib/types";
import { LeadEditor } from "./LeadEditor";
import { LeadMessage } from "./LeadMessage";
import { LeadTime } from "./LeadTime";

const title = (value: string) => value[0].toUpperCase() + value.slice(1);
function href(status: string | null, category: string | null) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (category) query.set("category", category);
  return `/dashboard${query.size ? `?${query}` : ""}`;
}
function subscribe(listener: () => void) {
  const media = window.matchMedia("(min-width: 1024px)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
type Props = { leads: Lead[]; total: number; counts: Record<string, number>; status: string | null; category: string | null };
export function ClientInbox({ leads, total, counts, status, category }: Props) {
  const router = useRouter();
  const [filterPending, startTransition] = useTransition();
  const desktop = useSyncExternalStore(subscribe, () => window.matchMedia("(min-width: 1024px)").matches, () => false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim().toLocaleLowerCase()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const visible = leads.filter(lead => !search || [lead.name, lead.email, lead.phone, lead.message].some(value => value.toLocaleLowerCase().includes(search)));
  const selected = visible.find(lead => lead.id === selectedId);
  function clearSearch() { setQuery(""); setSearch(""); }
  function details(lead: Lead) {
    return <div id={`request-details-${lead.id}`} className="request-detail" key={lead.id}><div className="detail-heading"><div><h2>{lead.name}</h2><p className="muted">{title(lead.service)} request</p><div className="badges detail-badges"><span className={`badge category-${lead.category}`}>{title(lead.category)}</span><span className={`badge ${lead.urgency}`}>{lead.urgency === "high" ? "Urgent" : `${title(lead.urgency)} urgency`}</span></div></div><LeadTime value={lead.created_at}/></div><p className="message">{lead.message}</p><div className="contact-links"><a href={`mailto:${lead.email.trim()}`}><Mail size={17} aria-hidden="true"/>{lead.email}</a>{lead.phone && <a href={`tel:${lead.phone.replace(/\s+/g, "")}`}><Phone size={17} aria-hidden="true"/>{lead.phone}</a>}</div><LeadEditor lead={lead} draft={drafts[lead.id] ?? lead.note} onDraftChange={value => setDrafts(previous => ({ ...previous, [lead.id]: value }))}/></div>;
  }
  return <><div className="summary-grid inbox-summary" role="group" aria-label="Filter by status">{["", ...statuses].map(value => <button type="button" className={`summary-tile ${value ? `status-${value}` : "summary-all"}`} aria-pressed={(status ?? "") === value} disabled={filterPending} key={value} onClick={() => startTransition(() => router.push(href(status === value ? null : value || null, category), { scroll: false }))}><span className="summary-label">{value && <span className="status-dot"/>}{value ? title(value) : "All"}</span><strong>{value ? counts[value] : total}</strong></button>)}</div><div className="filters"><div className="filter-group"><span className="filter-label">Category</span><nav className="chip-row" aria-label="Filter by category">{["", ...categories].map(value => <Link scroll={false} className="chip" aria-current={(category ?? "") === value ? "true" : undefined} href={href(status, value || null)} key={value}>{value ? title(value) : "All"}</Link>)}</nav></div></div><div className="inbox-layout"><div className="inbox-list-column"><div className="inbox-search"><label htmlFor="inbox-search">Search requests</label><div className="search-input"><Search size={18} aria-hidden="true"/><input id="inbox-search" type="search" placeholder="Name, email, phone or message" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off"/>{query && <button type="button" className="search-clear" aria-label="Clear search" onClick={clearSearch}><X size={18} aria-hidden="true"/></button>}</div></div><p className="inbox-count muted" role="status">{visible.length} of {total} requests{total === 500 && " (latest 500)"}</p><div className="compact-list" aria-busy={filterPending}>{visible.map(lead => {
    const expanded = selected?.id === lead.id;
    return <article className={`compact-card edge-${lead.status}${expanded ? " is-selected" : ""}`} key={lead.id} data-lead-id={lead.id}><button type="button" className="compact-toggle" aria-expanded={expanded} aria-controls={expanded ? `request-details-${lead.id}` : undefined} onClick={() => { setSelectedId(expanded ? null : lead.id); }}><span className="compact-top"><span className="compact-identity"><strong>{lead.name}</strong><span>{title(lead.service)}</span></span><LeadTime value={lead.created_at} compact/></span><span className="compact-badges"><span className={`badge status-${lead.status}`}>{title(lead.status)}</span><span className={`badge category-${lead.category}`}>{title(lead.category)}</span>{lead.urgency === "high" && <span className="badge high">Urgent</span>}{lead.note && <span className="note-indicator" title="Has a private note"><StickyNote size={15} aria-hidden="true"/><span className="sr-only">Has a private note</span></span>}</span><LeadMessage message={lead.message}/></button>{expanded && !desktop && details(lead)}</article>;
  })}{!visible.length && <div className="panel empty-state"><Inbox size={28} aria-hidden="true"/><h2>{query || status || category ? "No matching requests" : "A fresh start for your inbox"}</h2><p className="muted">{query ? "Try another name, email, phone or phrase." : "New requests will appear here."}</p>{query && <button type="button" className="quiet" onClick={clearSearch}>Clear search</button>}{(status || category) && <Link scroll={false} className="button quiet" href="/dashboard">Clear filters</Link>}</div>}</div></div>{desktop && <aside className="request-detail-pane" aria-label="Request details">{selected ? details(selected) : <div className="panel empty-state"><Inbox size={30} aria-hidden="true"/><h2>Select a request</h2><p className="muted">Choose a request to see the details and follow up.</p></div>}</aside>}</div></>;
}
