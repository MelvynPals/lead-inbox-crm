import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/src/components/LoginForm";
import { BusinessMark } from "@/src/components/BusinessMark";
import { business } from "@/src/content/business";
export function LoginSection() { return <section className="login"><div className="panel"><div className="login-heading"><BusinessMark/><div className="form-head"><h1>Owner sign in</h1><p>{business.shortName} &middot; Lead Inbox</p></div><p className="muted">Welcome back. Let&apos;s take care of your neighbors.</p></div><LoginForm/><Link className="login-back" href="/"><ArrowLeft size={16} aria-hidden="true"/>Back to {business.shortName}</Link></div></section>; }
