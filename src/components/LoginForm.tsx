"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { login } from "@/app/actions";
export function LoginForm() {
  const [email, setEmail] = useState("");
  const password = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(login, { error: "" });
  useEffect(() => { if (state.error && password.current) password.current.value = ""; }, [state]);
  return <form action={action} className="stack"><label htmlFor="email">Email<input id="email" name="email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" required/></label><label htmlFor="password">Password<input id="password" name="password" type="password" ref={password} autoComplete="current-password" required/></label>{state.error && <p role="alert" className="error-summary">{state.error}</p>}<button className="full-width" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button></form>;
}
