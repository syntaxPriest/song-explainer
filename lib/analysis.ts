import "server-only";

import { getCachedAnalysis, putCachedAnalysis } from "@/lib/cache";
import { getLyrics } from "@/lib/lyrics";
import { analyzeWithOpenAI } from "@/lib/openai";
import {
  PROMPT_VERSION,
  type AiSimilarSong,
  type Analysis,
  type AnalysisCore,
} from "@/lib/schemas";
import { getTrack, searchTracks } from "@/lib/spotify";

export type AnalysisResult = {
  analysis: Analysis;
  cached: boolean;
  trackKey: string;
};

export async function getOrCreateAnalysis(
  spotifyId: string,
  opts: { refresh?: boolean } = {},
): Promise<AnalysisResult> {
  const track = await getTrack(spotifyId);
  const trackKey = track.external_ids?.isrc ?? track.id;

  if (!opts.refresh) {
    const cached = await getCachedAnalysis(trackKey, PROMPT_VERSION);
    if (cached) {
      return { analysis: cached, cached: true, trackKey };
    }
  }

  const title = track.name;
  const artist = track.artists.map((a) => a.name).join(", ");
  const album = track.album.name;

  const { lyrics } = await getLyrics(title, artist);
  const core = await analyzeWithOpenAI({ title, artist, album, lyrics });

  const aiSimilarSongs = await enrichSimilarSongs(core.aiSimilarSongs);
  const analysis: Analysis = { ...core, aiSimilarSongs };

  await putCachedAnalysis(trackKey, PROMPT_VERSION, analysis);

  return { analysis, cached: false, trackKey };
}

async function enrichSimilarSongs(
  songs: AnalysisCore["aiSimilarSongs"],
): Promise<AiSimilarSong[]> {
  return Promise.all(
    songs.map(async (song) => {
      try {
        const results = await searchTracks(`${song.title} ${song.artist}`, 1);
        const hit = results[0];
        if (!hit) return { ...song, imageUrl: null, spotifyId: null };
        return {
          ...song,
          imageUrl:
            hit.album.images[1]?.url ?? hit.album.images[0]?.url ?? null,
          spotifyId: hit.id,
        };
      } catch (err) {
        console.warn("[analysis] enrich similar song failed:", err);
        return { ...song, imageUrl: null, spotifyId: null };
      }
    }),
  );
}
