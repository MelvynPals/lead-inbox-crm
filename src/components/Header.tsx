import Link from "next/link";
import { logout } from "@/app/actions";
export function Header({ owner = false }: { owner?: boolean }) {
  return <header className="header"><Link className="brand" href="/"><span className="mark" aria-hidden="true">≡</span>Lead Inbox</Link>{owner ? <form action={logout}><button className="quiet">Sign out</button></form> : <Link className="header-link" href="/login">Owner login</Link>}</header>;
}
