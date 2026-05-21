import { Disc3 } from "lucide-react";

import { FeaturedRail } from "@/components/featured-rail";
import { SongSearch } from "@/components/song-search";
import { getFeaturedTracks } from "@/lib/featured";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // Featured covers come from Spotify and are heavily Redis-cached via
  // getTrack. Cold start = a small burst of API calls; warm = instant.
  // Any individual miss is silently dropped.
  const featured = await getFeaturedTracks().catch(() => []);

  return (
    <main className="relative min-h-[calc(100vh-4rem)]">
      {/* Layered atmospherics: a soft gold wash from the top, a warm
          honey/amber bloom off-center, and a pale champagne highlight
          above the headline. Anchored to the viewport (not the content
          column) so the neon cuts edge-to-edge. Intensities kept low
          so album-art glows on cards still read on top. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[90vh] w-screen"
        style={{
          background: `
            radial-gradient(60% 50% at 40% 0%, oklch(0.72 0.11 85 / 0.22), transparent 70%),
            radial-gradient(50% 45% at 75% 30%, oklch(0.62 0.10 70 / 0.18), transparent 70%),
            radial-gradient(40% 30% at 50% -5%, oklch(0.90 0.07 90 / 0.14), transparent 70%)
          `,
        }}
      />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-12 sm:py-16">
        <header className="flex flex-col items-center gap-5 pt-6 text-center sm:pt-10">
          <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
            <Disc3 className="h-3.5 w-3.5" aria-hidden />
            Song Explainer
          </div>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
            What is this song
            <span
              className="block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, oklch(0.88 0.16 330), oklch(0.78 0.18 290), oklch(0.85 0.18 350))",
              }}
            >
              actually about?
            </span>
          </h1>
          <p className="max-w-xl text-base text-[color:var(--color-muted-foreground)] sm:text-lg">
            Paste a Spotify link, an ISRC, or just type{" "}
            <span className="text-[color:var(--color-foreground)]">
              song — artist
            </span>
            . Get themes, line-by-line meaning, references, and tracks in the
            same vein.
          </p>
        </header>

        <div className="mt-10 w-full max-w-2xl">
          <SongSearch />
        </div>

        <div className="mt-16 w-full sm:mt-20">
          <FeaturedRail tracks={featured} />
        </div>
      </div>
    </main>
  );
}
