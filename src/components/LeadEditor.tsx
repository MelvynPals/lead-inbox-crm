"use client";
import { useActionState } from "react";
import { saveLead } from "@/app/actions";
import { ResponsiveSelect } from "@/src/components/ResponsiveSelect";
import { statuses, type Lead } from "@/src/lib/types";
export function LeadEditor({ lead }: { lead: Lead }) {
  const [state, action, pending] = useActionState(saveLead.bind(null, lead.id), { error: "", saved: false });
  return <form action={action} className="editor"><ResponsiveSelect key={`${lead.id}-${lead.status}`} id={`status-${lead.id}`} name="status" label="Status" options={statuses} defaultValue={lead.status}/><label htmlFor={`note-${lead.id}`}>Private note<textarea id={`note-${lead.id}`} name="note" defaultValue={lead.note} placeholder="Add a follow-up or reminder" rows={3}/></label><small className="muted">Up to 2,000 characters. Saving replaces the note.</small><button disabled={pending}>{pending ? "Saving…" : "Save changes"}</button><div aria-live="polite">{state.error ? <p className="error">{state.error}</p> : state.saved ? <p className="success">Changes saved.</p> : null}</div></form>;
}
