import { Clock3, ShieldCheck, HeartHandshake, House } from "lucide-react";
import { LeadForm } from "@/src/components/LeadForm";
import { business } from "@/src/content/business";

const trustIcons = [Clock3, ShieldCheck, HeartHandshake];
export function RequestSection() {
  return <section className="public-grid" aria-labelledby="request-heading"><div className="intro"><span className="eyebrow"><House size={18} aria-hidden="true"/>{business.tagline}</span><h1 id="request-heading">Let&apos;s get your home sorted.</h1><p>From the little fixes to the fresh starts, we&apos;re here to help.</p><ul className="trust-list">{business.trustPoints.map((point, index) => { const Icon = trustIcons[index]; return <li key={point}><Icon size={22} aria-hidden="true"/>{point}</li>; })}</ul><div className="intro-note"><HeartHandshake size={24} aria-hidden="true"/><p>Tell us a little about your home. We&apos;ll take it from there, together.</p></div></div><LeadForm/></section>;
}
