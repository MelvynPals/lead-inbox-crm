"use client";
import { useActionState } from "react";
import { login } from "@/app/actions";
export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: "" });
  return <form action={action} className="stack"><label htmlFor="email">Email<input id="email" name="email" type="email" autoComplete="username" required/></label><label htmlFor="password">Password<input id="password" name="password" type="password" autoComplete="current-password" required/></label>{state.error && <p role="alert" className="error">{state.error}</p>}<button disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button></form>;
}
