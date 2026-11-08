import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Lead Inbox", template: "%s | Lead Inbox" },
  description: "Request a service and manage customer conversations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
    >
      <body><a className="skip" href="#main">Skip to content</a>{children}</body>
    </html>
  );
}
