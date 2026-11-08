import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ownerAuthorized } from "@/src/lib/auth";
import { Header } from "@/src/components/Header";
import { InboxSection } from "@/src/sections/dashboard/InboxSection";
export const metadata = { title: "Your inbox", robots: { index: false, follow: false } };
async function ProtectedInbox({ searchParams }: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  if (!await ownerAuthorized()) redirect("/login");
  return <div className="shell"><div className="wrap"><Header owner/><main id="main"><InboxSection searchParams={searchParams}/></main></div></div>;
}
export default function DashboardPage(props: { searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  return <Suspense fallback={<main id="main" className="shell"><p>Loading inbox…</p></main>}><ProtectedInbox {...props}/></Suspense>;
}
