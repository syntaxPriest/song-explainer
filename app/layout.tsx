import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { Disc3 } from "lucide-react";

import { HeaderAuth } from "@/components/header-auth";
import { HeaderSearch } from "@/components/header-search";
import { SITE, siteUrl } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE.name, template: `%s — ${SITE.name}` },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ variables: { colorPrimary: "#c084fc" } }}>
      <html lang="en" className="dark">
        <body className="min-h-screen antialiased">
          <header
            className="sticky top-0 z-50 backdrop-blur-2xl backdrop-saturate-150"
            style={{
              // Very low-alpha white tint so the neon behind reads through.
              // Bottom edge fades to a touch more black for separation
              // against the page content underneath.
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%), linear-gradient(180deg, rgba(8,8,12,0.25), rgba(8,8,12,0.45))",
              // Single hairline at the bottom + inset top highlight + soft
              // drop shadow. The hairline lives in box-shadow (not border)
              // so it doesn't add layout height and won't double up against
              // a Tailwind `border-b`.
              boxShadow:
                "inset 0 1px 0 var(--glass-highlight), inset 0 -1px 0 var(--glass-border), 0 16px 32px -20px rgba(0,0,0,0.7)",
            }}
          >
            <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-6">
              <Link
                href="/"
                className="inline-flex shrink-0 items-center gap-2 text-sm font-medium"
              >
                <Disc3 className="h-4 w-4" aria-hidden />
                Song Explainer
              </Link>
              <HeaderSearch />
              <div className="flex shrink-0 items-center gap-3">
                <HeaderAuth />
              </div>
            </nav>
          </header>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
