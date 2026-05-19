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
          <header className="sticky top-0 z-50 border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]/80 backdrop-blur">
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
