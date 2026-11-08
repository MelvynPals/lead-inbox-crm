"use client";

import { useActionState, useOptimistic, useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { saveLead } from "@/app/actions";
import { statuses, type Lead } from "@/src/lib/types";

export function LeadEditor({ lead, draft, onDraftChange, onStatusSaved }: { lead: Lead; draft: string; onDraftChange: (value: string) => void; onStatusSaved: () => void }) {
  const [noteState, noteAction, notePending] = useActionState(saveLead.bind(null, lead.id), { error: "", saved: false });
  const [status, setStatus] = useOptimistic(lead.status);
  const [statusPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  function changeStatus(next: Lead["status"]) {
    setError("");
    startTransition(async () => {
      setStatus(next);
      setFeedback("");
      const form = new FormData();
      form.set("status", next);
      form.set("note", lead.note);
      try {
        const result = await saveLead(lead.id, { error: "", saved: false }, form);
        if (result.error) setError(result.error);
        else { setFeedback("Saved"); onStatusSaved(); }
      } catch { setError("We couldn't save that status. Please try again."); }
    });
  }
  return <div className="lead-controls"><div className="status-control"><span className="filter-label" id={`status-label-${lead.id}`}>Status</span><div className="status-pills" role="group" aria-labelledby={`status-label-${lead.id}`}>{statuses.map(value => <button type="button" className="status-pill" key={value} aria-pressed={status === value} disabled={statusPending || notePending} onClick={() => changeStatus(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div><p className="save-feedback success" aria-live="polite">{statusPending ? "Saving status..." : feedback && <><Check size={14} aria-hidden="true"/> {feedback}</>}</p><small>Status saves automatically.</small></div><form action={noteAction} className="editor"><input type="hidden" name="status" value={status}/><label htmlFor={`note-${lead.id}`}>Private note<textarea id={`note-${lead.id}`} name="note" value={draft} onChange={event => onDraftChange(event.target.value)} placeholder="A follow-up, a reminder, or a little context..." rows={3}/></label><div className="note-footer"><span className={noteState.error ? "error" : "save-feedback success"} role={noteState.error ? "alert" : "status"}>{notePending ? "Saving note..." : noteState.error || (noteState.saved ? "Changes saved." : "Only you can see this note.")}</span><button className="quiet" disabled={notePending || statusPending}>{notePending ? "Saving..." : "Save note"}</button></div></form>{error && <div className="toast" role="alert"><span>{error} Your previous status has been restored.</span><button type="button" aria-label="Dismiss status error" onClick={() => setError("")}><X size={18} aria-hidden="true"/></button></div>}</div>;
}
