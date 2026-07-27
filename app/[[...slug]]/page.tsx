import type { Metadata } from "next";
import { headers } from "next/headers";

import ReevuClient from "../ReevuClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = host
    ? `${protocol}://${host}`
    : "https://reevu-watchbetter.example";
  const imageUrl = `${origin}/og.png`;

  return {
    openGraph: {
      title: "Reevu — Find Something Worth Watching",
      description:
        "Discover films, rate what you watch, and keep your cinematic life in one beautifully curated place.",
      type: "website",
      url: origin,
      siteName: "Reevu",
      images: [{ url: imageUrl, width: 1728, height: 905, alt: "Reevu" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Reevu — Find Something Worth Watching",
      description:
        "Discover films, rate what you watch, and keep your cinematic life in one beautifully curated place.",
      images: [imageUrl],
    },
  };
}

export default function ReevuPage() {
  return <ReevuClient />;
}
