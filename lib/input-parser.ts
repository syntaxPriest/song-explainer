import { z } from "zod";

export const ParsedInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("spotify-track"), id: z.string().min(1) }),
  z.object({ kind: z.literal("apple-music"), trackId: z.string().min(1) }),
  z.object({ kind: z.literal("isrc"), isrc: z.string().length(12) }),
  z.object({ kind: z.literal("free-text"), query: z.string().min(1) }),
]);

export type ParsedInput = z.infer<typeof ParsedInputSchema>;

const SPOTIFY_TRACK_RE =
  /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)(?:\?.*)?$/;
const APPLE_MUSIC_RE =
  /^https?:\/\/music\.apple\.com\/[a-z]{2}\/album\/[^/]+\/\d+(?:\?i=(\d+))?/;
const ISRC_RE = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;

export function parseInput(raw: string): ParsedInput {
  const value = raw.trim();
  if (value.length === 0) {
    throw new Error("Input is empty");
  }

  const spotify = SPOTIFY_TRACK_RE.exec(value);
  if (spotify) {
    return { kind: "spotify-track", id: spotify[1] };
  }

  const apple = APPLE_MUSIC_RE.exec(value);
  if (apple && apple[1]) {
    return { kind: "apple-music", trackId: apple[1] };
  }

  const upper = value.toUpperCase().replace(/[\s-]/g, "");
  if (ISRC_RE.test(upper)) {
    return { kind: "isrc", isrc: upper };
  }

  return { kind: "free-text", query: value };
}
