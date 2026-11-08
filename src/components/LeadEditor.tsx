"use client";

import { useActionState, useOptimistic, useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { saveLead } from "@/app/actions";
import { statuses, type Lead } from "@/src/lib/types";

export function LeadEditor({ lead }: { lead: Lead }) {
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
        else setFeedback("Saved");
      } catch { setError("We couldn't save that status. Please try again."); }
    });
  }
  return <div className="lead-controls"><div className="status-control"><label htmlFor={`status-${lead.id}`}>Status<select id={`status-${lead.id}`} name="status" value={status} disabled={statusPending || notePending} onChange={event => changeStatus(event.target.value as Lead["status"])}>{statuses.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label><p className="save-feedback success" aria-live="polite">{statusPending ? "Saving status..." : feedback && <><Check size={14} aria-hidden="true"/> {feedback}</>}</p><small>Status saves automatically.</small></div><form action={noteAction} className="editor"><input type="hidden" name="status" value={status}/><label htmlFor={`note-${lead.id}`}>Private note<textarea id={`note-${lead.id}`} name="note" defaultValue={lead.note} placeholder="A follow-up, a reminder, or a little context..." rows={3}/></label><div className="note-footer"><span className={noteState.error ? "error" : "save-feedback success"} role={noteState.error ? "alert" : "status"}>{notePending ? "Saving note..." : noteState.error || (noteState.saved ? "Changes saved." : "Only you can see this note.")}</span><button className="quiet" disabled={notePending || statusPending}>{notePending ? "Saving..." : "Save note"}</button></div><div className="saved-note"><strong>Last saved note</strong><p>{lead.note || "No note saved yet."}</p></div></form>{error && <div className="toast" role="alert"><span>{error} Your previous status has been restored.</span><button type="button" aria-label="Dismiss status error" onClick={() => setError("")}><X size={18} aria-hidden="true"/></button></div>}</div>;
}
