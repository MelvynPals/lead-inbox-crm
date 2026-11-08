import { Header } from "@/src/components/Header";
import { BusinessFooter } from "@/src/components/BusinessFooter";
import { RequestSection } from "@/src/sections/home/RequestSection";
export const metadata = { title: "A little help for your home" };
export default function Home() { return <div className="shell"><div className="wrap"><Header/><main id="main"><RequestSection/></main><BusinessFooter/></div></div>; }
