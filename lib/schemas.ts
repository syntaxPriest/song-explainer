import { z } from "zod";

const ThemeSchema = z.object({
  title: z.string(),
  body: z.string(),
});

const LineBreakdownSchema = z.object({
  excerpt: z.string(),
  interpretation: z.string(),
});

const ReferenceSchema = z.object({
  type: z.enum(["cultural", "literary", "biographical", "musical"]),
  title: z.string(),
  body: z.string(),
});

const AiSimilarSongCoreSchema = z.object({
  title: z.string(),
  artist: z.string(),
  rationale: z.string(),
});

/**
 * Strict schema used as OpenAI's structured-output response_format. Strict
 * mode requires every field to be present, so this version has no optional
 * fields. Enrichment fields (imageUrl, spotifyId) are added server-side
 * after the OpenAI call and live on {@link AnalysisSchema}.
 */
export const AnalysisCoreSchema = z.object({
  summary: z.string(),
  moodTags: z.array(z.string()),
  themes: z.array(ThemeSchema),
  lineBreakdowns: z.array(LineBreakdownSchema),
  references: z.array(ReferenceSchema),
  aiSimilarSongs: z.array(AiSimilarSongCoreSchema),
});

const AiSimilarSongEnrichedSchema = AiSimilarSongCoreSchema.extend({
  // optional so older cached analyses (pre-enrichment) still parse
  imageUrl: z.string().nullable().optional(),
  spotifyId: z.string().nullable().optional(),
});

export const AnalysisSchema = AnalysisCoreSchema.extend({
  aiSimilarSongs: z.array(AiSimilarSongEnrichedSchema),
});

export type AnalysisCore = z.infer<typeof AnalysisCoreSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type AiSimilarSong = z.infer<typeof AiSimilarSongEnrichedSchema>;

// Bump when the prompt content or required output shape changes so the cache
// invalidates and fresh analyses regenerate.
export const PROMPT_VERSION = "v3";
