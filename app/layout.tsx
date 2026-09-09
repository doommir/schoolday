import {PolicyLinks} from './policy-shell';
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Schoolday OS · NovaPath",
  description: "A grades 6–8 learning day. Learn solo or in live and asynchronous Squads, with generated lessons, saved progress, and teacher review.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}<PolicyLinks/></body>
    </html>
  );
}
