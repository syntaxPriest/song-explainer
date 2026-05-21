import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { Disc3, Github } from "lucide-react";

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
        {/* Flex column + page children growing to fill keeps the footer
            pinned to the viewport bottom on short pages (no long scroll
            just to see it) and at the natural end of the document on
            long pages. */}
        <body className="flex min-h-screen flex-col antialiased">
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
          <footer
            className="mt-auto backdrop-blur-2xl backdrop-saturate-150"
            style={{
              backgroundImage:
                "linear-gradient(0deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%), linear-gradient(0deg, rgba(8,8,12,0.35), rgba(8,8,12,0.15))",
              boxShadow:
                "inset 0 1px 0 var(--glass-border), inset 0 -1px 0 var(--glass-highlight), 0 -16px 32px -20px rgba(0,0,0,0.6)",
            }}
          >
            <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-6 py-5 text-sm sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-medium text-[color:var(--color-foreground)]"
              >
                <Disc3
                  className="h-4 w-4 text-[color:var(--color-primary)]"
                  aria-hidden
                />
                Song Explainer
              </Link>

              <div className="flex items-center gap-5 text-xs text-[color:var(--color-muted-foreground)]">
                <p>
                  © 2026 · Built by{" "}
                  <a
                    href="https://github.com/syntaxpriest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[color:var(--color-foreground)] underline-offset-4 transition-colors hover:text-[color:var(--color-primary)] hover:underline"
                  >
                    Daniel Adewale
                  </a>
                </p>
                <a
                  href="https://github.com/syntaxpriest"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--glass-bg-strong)] hover:text-[color:var(--color-foreground)]"
                >
                  <Github className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </div>
          </footer>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
