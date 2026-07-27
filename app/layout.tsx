import type { Metadata } from "next";

import "../src/index.css";

export const metadata: Metadata = {
  title: {
    default: "Reevu — Find Something Worth Watching",
    template: "%s | Reevu",
  },
  description:
    "Discover films, rate what you watch, and keep your cinematic life in one beautifully curated place.",
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
      <body>{children}</body>
    </html>
  );
}
