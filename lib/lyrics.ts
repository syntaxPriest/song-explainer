import "server-only";

import { getLyricsForTrack as getGeniusLyrics } from "@/lib/genius";
import { lookupSyncedLyrics } from "@/lib/lrclib";
import { getMusixmatchLyrics } from "@/lib/musixmatch";

export type LyricsProvider = "musixmatch" | "genius" | "lrclib";

export type LyricsResult = {
  lyrics: string;
  source: string;
  provider: LyricsProvider;
  /** True when the provider only returned a truncated snippet (free Musixmatch tier). */
  truncated: boolean;
};

/**
 * Thrown when every configured lyrics provider returns nothing usable.
 * Distinct from generic failures (auth, rate limits, network) so the API
 * layer can surface a clean 404 + the client can render a tailored
 * "no lyrics for this song" state instead of the generic error card.
 */
export class LyricsNotFoundError extends Error {
  readonly code = "LYRICS_NOT_FOUND" as const;
  constructor(
    readonly title: string,
    readonly artist: string,
    readonly providerErrors: string[],
  ) {
    super(`No lyrics available for "${title}" by ${artist}`);
    this.name = "LyricsNotFoundError";
  }
}

/**
 * Tries each configured lyrics provider in order and returns the first one
 * that produces usable text. Resilient against any single provider failing
 * (Musixmatch coverage gaps, Genius HTML changes, LRCLib misses).
 *
 * Order:
 *   1. Musixmatch — commercially licensed; preferred when MUSIXMATCH_KEY is set
 *   2. Genius — dev HTML scrape; broad catalog but brittle
 *   3. LRCLib — community-sourced; broad catalog; no auth required
 *
 * Per CLAUDE.md / PLAN.md, only Musixmatch is properly licensed. The other
 * providers are dev-side fallbacks and the analysis-only path (server-side
 * prompt) — the Lyrics tab UI has its own licensing caveat.
 */
export async function getLyrics(
  title: string,
  artist: string,
): Promise<LyricsResult> {
  const errors: string[] = [];

  if (process.env.MUSIXMATCH_KEY) {
    try {
      const r = await getMusixmatchLyrics(title, artist);
      return { ...r, provider: "musixmatch" };
    } catch (err) {
      errors.push(`musixmatch: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (process.env.GENIUS_ACCESS_TOKEN) {
    try {
      const r = await getGeniusLyrics(title, artist);
      return {
        lyrics: r.lyrics,
        source: r.source,
        provider: "genius",
        truncated: false,
      };
    } catch (err) {
      errors.push(`genius: ${err instanceof Error ? err.message : err}`);
    }
  }

  try {
    const r = await lookupSyncedLyrics({ title, artist });
    if (r?.plain && r.plain.trim().length > 30) {
      return {
        lyrics: r.plain,
        source: r.sourceUrl,
        provider: "lrclib",
        truncated: false,
      };
    }
    errors.push("lrclib: no match");
  } catch (err) {
    errors.push(`lrclib: ${err instanceof Error ? err.message : err}`);
  }

  throw new LyricsNotFoundError(title, artist, errors);
}
