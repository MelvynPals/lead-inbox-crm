import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions";
import { business } from "@/src/content/business";
import { BusinessMark } from "./BusinessMark";

export function Header({ owner = false }: { owner?: boolean }) {
  return <header className="header"><Link className="brand" href={owner ? "/dashboard" : "/"}><BusinessMark/><span className="brand-name">{owner ? `${business.shortName} ? Lead Inbox` : business.name}</span></Link>{owner ? <form action={logout}><button className="quiet"><LogOut size={18} aria-hidden="true"/><span>Sign out</span></button></form> : <Link className="header-link" href="/login">Owner login</Link>}</header>;
}
