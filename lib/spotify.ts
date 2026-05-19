import "server-only";
import { z } from "zod";

import { getRedis } from "@/lib/redis";

const TRACK_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h per CLAUDE.md

const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("Bearer"),
  expires_in: z.number(),
});

const ImageSchema = z.object({
  url: z.string().url(),
  width: z.number().nullable(),
  height: z.number().nullable(),
});

const ArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(ArtistSchema),
  album: z.object({
    id: z.string(),
    name: z.string(),
    images: z.array(ImageSchema),
    release_date: z.string(),
  }),
  external_ids: z.object({ isrc: z.string().optional() }).optional(),
  duration_ms: z.number(),
  preview_url: z.string().nullable().optional(),
});

export type SpotifyTrack = z.infer<typeof TrackSchema>;

const SearchResponseSchema = z.object({
  tracks: z.object({ items: z.array(TrackSchema) }),
});

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 10_000) {
    return cachedToken.value;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env.local",
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Spotify token request failed: ${res.status}`);
  }

  const parsed = TokenResponseSchema.parse(await res.json());
  cachedToken = {
    value: parsed.access_token,
    expiresAt: now + parsed.expires_in * 1000,
  };
  return cachedToken.value;
}

async function spotifyFetch<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    cachedToken = null;
    throw new Error("Spotify auth expired");
  }
  if (!res.ok) {
    throw new Error(`Spotify request failed: ${res.status} ${path}`);
  }

  return schema.parse(await res.json());
}

export async function getTrack(id: string): Promise<SpotifyTrack> {
  const redis = getRedis();
  const cacheKey = `spotify:track:${id}`;
  if (redis) {
    try {
      const hit = await redis.get<unknown>(cacheKey);
      if (hit) {
        // Upstash returns parsed JSON; if it can't be parsed back into the
        // schema, treat as miss instead of throwing.
        const parsed = TrackSchema.safeParse(hit);
        if (parsed.success) return parsed.data;
      }
    } catch (err) {
      console.warn("[spotify cache] read failed:", err);
    }
  }
  const track = await spotifyFetch(
    `/tracks/${encodeURIComponent(id)}`,
    TrackSchema,
  );
  if (redis) {
    try {
      await redis.set(cacheKey, track, { ex: TRACK_CACHE_TTL_SECONDS });
    } catch (err) {
      console.warn("[spotify cache] write failed:", err);
    }
  }
  return track;
}

export async function searchTracks(
  query: string,
  limit = 5,
): Promise<SpotifyTrack[]> {
  const qs = new URLSearchParams({
    q: query,
    type: "track",
    limit: String(limit),
  });
  const data = await spotifyFetch(
    `/search?${qs.toString()}`,
    SearchResponseSchema,
  );
  return data.tracks.items;
}

export async function findTrackByIsrc(
  isrc: string,
): Promise<SpotifyTrack | null> {
  const qs = new URLSearchParams({
    q: `isrc:${isrc}`,
    type: "track",
    limit: "1",
  });
  const data = await spotifyFetch(
    `/search?${qs.toString()}`,
    SearchResponseSchema,
  );
  return data.tracks.items[0] ?? null;
}

const RecommendationsResponseSchema = z.object({
  tracks: z.array(TrackSchema),
});

/**
 * Spotify deprecated `/recommendations` for new applications in Nov 2024.
 * Apps created before that date still have access. Callers should treat
 * a 403/404 here as "feature unavailable" and continue with AI picks only.
 */
export async function getRecommendations(
  seedTrackId: string,
  limit = 6,
): Promise<SpotifyTrack[]> {
  const qs = new URLSearchParams({
    seed_tracks: seedTrackId,
    limit: String(limit),
  });
  try {
    const data = await spotifyFetch(
      `/recommendations?${qs.toString()}`,
      RecommendationsResponseSchema,
    );
    return data.tracks;
  } catch (err) {
    if (
      err instanceof Error &&
      /failed: (403|404)/.test(err.message)
    ) {
      return [];
    }
    throw err;
  }
}
