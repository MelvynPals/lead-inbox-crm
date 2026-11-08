import { Header } from "@/src/components/Header";
import { LoginSection } from "@/src/sections/login/LoginSection";
export const metadata = { title: "Owner login" };
export default function LoginPage() { return <div className="shell"><div className="wrap"><Header/><main id="main"><LoginSection/></main></div></div>; }
