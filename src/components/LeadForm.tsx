"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, CheckCircle2, Sparkles, Wrench, MessagesSquare, House, Send } from "lucide-react";
import { fieldErrors } from "@/src/lib/validation";
import { services, type LeadInput } from "@/src/lib/types";

const serviceIcons = [Sparkles, Wrench, MessagesSquare, House];
export function LeadForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<LeadInput | null>(null);
  const [message, setMessage] = useState("");
  const summary = useRef<HTMLDivElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const invalid = fieldErrors(data);
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      event.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(invalid)[0]}"]`)?.focus();
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const body = await response.json();
      if (!response.ok) {
        setErrors({ form: body.error ?? "We couldn't send your request. Please try again." });
        requestAnimationFrame(() => summary.current?.focus());
      } else setSent(data as LeadInput);
    } catch {
      setErrors({ form: "We couldn't connect. Your details are still here - please try again." });
      requestAnimationFrame(() => summary.current?.focus());
    } finally { setPending(false); }
  }
  if (sent) return <div className="panel confirmation" role="status"><div className="confirmation-icon"><CheckCircle2 size={32} aria-hidden="true"/></div><div className="form-head"><h2>Thanks, {sent.name.trim().split(/\s+/)[0]}!</h2><p>We&apos;ll be in touch soon. Your home is in good hands.</p></div><div className="request-summary"><strong>{sent.service[0].toUpperCase() + sent.service.slice(1)} request</strong><p>{sent.message.length > 180 ? `${sent.message.slice(0, 180)}...` : sent.message}</p><small>We&apos;ll reply to {sent.email}.</small></div><button className="quiet" onClick={() => { setSent(null); setErrors({}); setMessage(""); }}>Send another request<ArrowRight size={18} aria-hidden="true"/></button></div>;
  const field = (name: string, label: string, type = "text", optional = false) => <div className="field"><label htmlFor={name}><span>{label}{optional && <span className="optional"> (optional)</span>}</span></label><input id={name} name={name} type={type} required={!optional} autoComplete={name === "name" ? "name" : name === "email" ? "email" : "tel"} placeholder={name === "name" ? "Your full name" : name === "email" ? "you@example.com" : "A number we can reach you on"} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined}/>{errors[name] && <p className="error" id={`${name}-error`}>{errors[name]}</p>}</div>;
  return <form className="panel" onSubmit={submit} noValidate aria-label="Service request"><div className="form-head"><h2>A helping hand starts here</h2><p>Tell us what you need. We&apos;ll work out the rest.</p></div>{errors.form && <div className="error-summary" ref={summary} tabIndex={-1} role="alert">{errors.form}</div>}<div className="fields">{field("name", "Your name")}{field("email", "Email address", "email")}</div>{field("phone", "Phone number", "tel", true)}<fieldset aria-describedby={errors.service ? "service-error" : undefined}><legend>What can we help with?</legend><div className="service-options" aria-invalid={!!errors.service}>{services.map((service, index) => { const Icon = serviceIcons[index]; return <label className="service-choice" key={service}><input type="radio" name="service" value={service} required/><span><Icon aria-hidden="true"/>{service[0].toUpperCase() + service.slice(1)}</span></label>; })}</div>{errors.service && <p className="error" id="service-error">{errors.service}</p>}</fieldset><div className="field"><label htmlFor="message">Tell us a little more</label><textarea id="message" name="message" required rows={4} value={message} onChange={event => setMessage(event.target.value)} placeholder="What's on your home to-do list? Let us know any details or dates you have in mind." aria-invalid={!!errors.message} aria-describedby={`message-hint${errors.message ? " message-error" : ""}`}/><div className="form-meta" id="message-hint"><span className="muted">A few details go a long way.</span><span className={message.trim().length > 2000 ? "error" : message.length >= 1800 ? "warning" : "muted"}>{message.length} / 2000</span></div>{errors.message && <p className="error" id="message-error">{errors.message}</p>}</div><button className="full-width" disabled={pending}><Send size={18} aria-hidden="true"/>{pending ? "Sending your request..." : "Send my request"}</button><small className="reassurance"><Check size={15} aria-hidden="true"/>No commitment. Just a friendly conversation.</small></form>;
}
