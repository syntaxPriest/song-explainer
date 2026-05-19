import { Disc3 } from "lucide-react";

import { SongSearch } from "@/components/song-search";

export default function LandingPage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.35_0.18_330/0.35),transparent_70%)]"
      />

      <header className="flex flex-col items-center gap-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-1 text-xs text-[color:var(--color-muted-foreground)]">
          <Disc3 className="h-3.5 w-3.5" aria-hidden />
          Song Explainer
        </div>
        <h1 className="font-serif text-4xl leading-tight sm:text-6xl">
          What is this song
          <span className="block text-[color:var(--color-primary)]">
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

      <SongSearch />

      <p className="text-xs text-[color:var(--color-muted-foreground)]">
        Phase 1 preview — analysis is hardcoded while the OpenAI integration is
        wired up.
      </p>
    </main>
  );
}
