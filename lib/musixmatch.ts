import "server-only";
import { z } from "zod";

/**
 * Musixmatch API client. Free tier returns 30%-truncated snippets and the
 * documented `lyrics_body` field is the only lyrics access — full lyrics
 * require a paid tier with a commercial license. See PLAN.md gotchas.
 */

const TrackSearchResponseSchema = z.object({
  message: z.object({
    header: z.object({ status_code: z.number() }),
    body: z.object({
      track_list: z
        .array(
          z.object({
            track: z.object({
              track_id: z.number(),
              track_name: z.string(),
              artist_name: z.string(),
              has_lyrics: z.number(),
            }),
          }),
        )
        .optional(),
    }),
  }),
});

const LyricsResponseSchema = z.object({
  message: z.object({
    header: z.object({ status_code: z.number() }),
    body: z.object({
      lyrics: z
        .object({
          lyrics_body: z.string(),
          // Musixmatch attribution is required by their TOS:
          // https://developer.musixmatch.com/documentation/customisation/copyright-and-disclaimer
          script_tracking_url: z.string().url().optional(),
          pixel_tracking_url: z.string().url().optional(),
        })
        .optional(),
    }),
  }),
});

const BASE = "https://api.musixmatch.com/ws/1.1";

async function mxFetch<T>(
  path: string,
  params: Record<string, string>,
  schema: z.ZodType<T>,
): Promise<T> {
  const key = process.env.MUSIXMATCH_KEY;
  if (!key) throw new Error("MUSIXMATCH_KEY is not set");
  const qs = new URLSearchParams({ ...params, apikey: key, format: "json" });
  const res = await fetch(`${BASE}${path}?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Musixmatch request failed: ${res.status} ${path}`);
  }
  return schema.parse(await res.json());
}

export async function getMusixmatchLyrics(
  title: string,
  artist: string,
): Promise<{ lyrics: string; source: string; truncated: boolean }> {
  const search = await mxFetch(
    "/track.search",
    {
      q_track: title,
      q_artist: artist,
      page_size: "1",
      s_track_rating: "desc",
    },
    TrackSearchResponseSchema,
  );
  const track = search.message.body.track_list?.[0]?.track;
  if (!track) {
    throw new Error(`Musixmatch found no match for "${title}" by ${artist}`);
  }
  if (!track.has_lyrics) {
    throw new Error(`Musixmatch has no lyrics for "${title}" by ${artist}`);
  }

  const lyricsRes = await mxFetch(
    "/track.lyrics.get",
    { track_id: String(track.track_id) },
    LyricsResponseSchema,
  );
  const body = lyricsRes.message.body.lyrics?.lyrics_body;
  if (!body) {
    throw new Error("Musixmatch returned no lyrics body");
  }

  // Free tier marks truncation with the literal string below
  const truncated = body.includes("This Lyrics is NOT for Commercial use");
  // Strip the trailing legal/attribution block — keep only the verse content
  // up to the divider Musixmatch inserts.
  const cleaned = body
    .split("*******")[0]
    .replace(/\.\.\.$/, "")
    .trim();

  return {
    lyrics: cleaned,
    source: `https://www.musixmatch.com/lyrics/${track.track_id}`,
    truncated,
  };
}
