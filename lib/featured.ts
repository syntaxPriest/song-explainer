import "server-only";

import { getTrack } from "@/lib/spotify";

/**
 * Curated landing-page rail. Spotify IDs are stable but if any 404 the
 * fetcher silently skips it — never breaks the page.
 */
const FEATURED_IDS = [
  "0VjIjW4GlUZAMYd2vXMi3b", // Blinding Lights — The Weeknd
  "2WfaOiMkCvy7F5fcp2zZ8L", // Take On Me — a-ha
  "0aym2LBJBk9DAYuHHutrIl", // Hey Jude — The Beatles
  "2qSkIjg1o9h3YT9RAgYN75", // Espresso — Sabrina Carpenter
  "003vvx7Niy0yvhvHt4a68B", // Mr. Brightside — The Killers
  "4u7EnebtmKWzUH433cf5Qv", // Bohemian Rhapsody — Queen
  "2Fxmhks0bxGSBdJ92vM42m", // Bad Guy — Billie Eilish
  "3USxtqRwSYz57Ewm6wWRMp", // Heat Waves — Glass Animals
];

export type FeaturedTrack = {
  id: string;
  name: string;
  artist: string;
  imageUrl: string | null;
};

export async function getFeaturedTracks(): Promise<FeaturedTrack[]> {
  const results = await Promise.allSettled(
    FEATURED_IDS.map((id) => getTrack(id)),
  );
  const tracks: FeaturedTrack[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const t = r.value;
    tracks.push({
      id: t.id,
      name: t.name,
      artist: t.artists.map((a) => a.name).join(", "),
      imageUrl: t.album.images[0]?.url ?? null,
    });
  }
  return tracks;
}
