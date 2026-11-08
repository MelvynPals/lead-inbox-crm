"use client";
import { useState, type FormEvent } from "react";
import { fieldErrors } from "@/src/lib/validation";
import { services } from "@/src/lib/types";

export function LeadForm() {
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const invalid = fieldErrors(data); setErrors(invalid);
    if (Object.keys(invalid).length) { document.getElementById(Object.keys(invalid)[0])?.focus(); return; }
    setPending(true);
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const body = await response.json();
      if (!response.ok) setErrors({ form: body.error ?? "Unable to send your request." });
      else setSuccess(true);
    } catch { setErrors({ form: "Unable to connect. Please try again." }); }
    finally { setPending(false); }
  }
  if (success) return <div className="panel" role="status"><h2 className="success">Request received</h2><p>Thank you for getting in touch. We’ll reply using the contact details you provided.</p><button className="quiet" onClick={() => { setSuccess(false); setErrors({}); }}>Send another request</button></div>;
  const field = (name: string, label: string, type = "text", optional = false) => <div className="field"><label htmlFor={name}>{label}{optional ? " (optional)" : ""}</label><input id={name} name={name} type={type} required={!optional} autoComplete={name === "name" ? "name" : name === "email" ? "email" : "tel"} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined}/>{errors[name] && <p className="error" id={`${name}-error`}>{errors[name]}</p>}</div>;
  return <form className="panel" onSubmit={submit} noValidate><div className="stack"><h2>Your service request</h2><p className="muted">All fields are required unless marked optional.</p></div><div className="fields">{field("name", "Name")}{field("email", "Email", "email")}</div>{field("phone", "Phone", "tel", true)}<div className="field"><label htmlFor="service">Service</label><select id="service" name="service" defaultValue="" required aria-invalid={!!errors.service} aria-describedby={errors.service ? "service-error" : undefined}><option value="" disabled>Choose a service</option>{services.map(service => <option key={service} value={service}>{service[0].toUpperCase() + service.slice(1)}</option>)}</select>{errors.service && <p id="service-error" className="error">{errors.service}</p>}</div><div className="field"><label htmlFor="message">How can we help?</label><textarea id="message" name="message" required rows={5} placeholder="Tell us what you need and when you need it." aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : "message-hint"}/><small id="message-hint">Up to 2,000 characters.</small>{errors.message && <p id="message-error" className="error">{errors.message}</p>}</div>{errors.form && <p className="error" role="alert">{errors.form}</p>}<button disabled={pending}>{pending ? "Sending request…" : "Send request"}</button></form>;
}
