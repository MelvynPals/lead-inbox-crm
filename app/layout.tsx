import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import { business } from "@/src/content/business";
import "./globals.css";

const headings = Fraunces({ subsets: ["latin"], variable: "--font-heading", display: "swap", axes: ["SOFT", "WONK", "opsz"] });
const body = Nunito_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: business.name, template: `%s | ${business.name}` },
  description: business.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${headings.variable} ${body.variable}`}
    >
      <body><a className="skip" href="#main">Skip to content</a>{children}</body>
    </html>
  );
}
