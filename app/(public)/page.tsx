import { Header } from "@/src/components/Header";
import { RequestSection } from "@/src/sections/home/RequestSection";
export const metadata = { title: "Request a service" };
export default function Home() { return <div className="shell"><div className="wrap"><Header/><main id="main"><RequestSection/></main><footer className="foot">Lead Inbox · Service requests, kept together.</footer></div></div>; }
