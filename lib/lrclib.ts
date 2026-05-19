import "server-only";
import { z } from "zod";

/**
 * LRCLib client. Community-sourced synced lyrics in LRC format.
 *
 * NOTE: LRCLib is not a licensed lyrics provider. Per CLAUDE.md and
 * PLAN.md, production should use Musixmatch's paid `track.subtitle.get`
 * endpoint before any public launch. This module exists as the dev
 * placeholder so the player + UI pipeline can be exercised end-to-end.
 */

const LrcLibResponseSchema = z.object({
  id: z.number(),
  trackName: z.string(),
  artistName: z.string(),
  albumName: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  instrumental: z.boolean().optional(),
  plainLyrics: z.string().nullable().optional(),
  syncedLyrics: z.string().nullable().optional(),
});

export type SyncedLine = { ms: number; text: string };

export type LyricsLookup = {
  synced: SyncedLine[] | null;
  plain: string | null;
  instrumental: boolean;
  source: "lrclib";
  sourceUrl: string;
};

const BASE = "https://lrclib.net/api";

export async function lookupSyncedLyrics(args: {
  title: string;
  artist: string;
  album?: string;
  durationSeconds?: number;
}): Promise<LyricsLookup | null> {
  const qs = new URLSearchParams({
    track_name: args.title,
    artist_name: args.artist,
  });
  if (args.album) qs.set("album_name", args.album);
  if (args.durationSeconds && args.durationSeconds > 0) {
    qs.set("duration", String(Math.round(args.durationSeconds)));
  }

  const res = await fetch(`${BASE}/get?${qs.toString()}`, {
    headers: {
      "User-Agent":
        "song-explainer/0.1 (dev; swap to Musixmatch for prod)",
    },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`LRCLib request failed: ${res.status}`);
  }
  const data = LrcLibResponseSchema.parse(await res.json());

  const synced = data.syncedLyrics ? parseLrc(data.syncedLyrics) : null;
  return {
    synced: synced && synced.length > 0 ? synced : null,
    plain: data.plainLyrics ?? null,
    instrumental: Boolean(data.instrumental),
    source: "lrclib",
    sourceUrl: `https://lrclib.net/api/get?${qs.toString()}`,
  };
}

/** Parses LRC format. Lines are `[mm:ss.xx]text` or `[mm:ss]text`. */
function parseLrc(raw: string): SyncedLine[] {
  const lines: SyncedLine[] = [];
  const re = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  for (const rawLine of raw.split(/\r?\n/)) {
    const text = rawLine.replace(re, "").trim();
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    const stamps: number[] = [];
    while ((match = re.exec(rawLine)) !== null) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fraction = match[3]
        ? Number(`0.${match[3]}`.padEnd(4, "0")) * 1000
        : 0;
      stamps.push(minutes * 60_000 + seconds * 1000 + Math.round(fraction));
    }
    for (const ms of stamps) lines.push({ ms, text });
  }
  lines.sort((a, b) => a.ms - b.ms);
  return lines;
}
