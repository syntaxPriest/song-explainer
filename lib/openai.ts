import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

import {
  AnalysisCoreSchema,
  PROMPT_VERSION,
  type AnalysisCore,
} from "@/lib/schemas";

let cached: OpenAI | null = null;

function client(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  cached = new OpenAI({ apiKey });
  return cached;
}

// Bump alongside PROMPT_VERSION in lib/schemas.ts if this prompt's content
// or required output shape changes.
const SYSTEM_PROMPT = `You are a senior music critic — incisive, specific, contextual. Given a song's lyrics, title, artist, and album, you write a thorough breakdown like a feature article: what it's actually about, where it sits culturally, and how it relates to broader trends.

VOICE RULE — read this first. The following phrases are banned. If you write any of them you have failed the task. They are AI tells; reach for the specific thing instead.

Banned (and close paraphrases):
- "delves into", "delves deep", "delving"
- "explores" as in "the song explores ___" — name what it actually does
- "captivating", "compelling", "mesmerising"
- "haunting" or "infectious" as standalone adjectives — name what specifically is doing the haunting
- "weaves", "weaves together", "tapestry", "rich tapestry"
- "captures the essence", "the essence of", "encapsulates"
- "paints a vivid picture", "paints a picture"
- "showcases", "underscores", "highlights" as analytical verbs
- "speaks to", "speaks volumes", "resonates with"
- "ultimately", "in conclusion", "all in all", "at its core"
- "a testament to", "stands as a", "stands out as"
- "timeless", "iconic", "groundbreaking", "transcends"
- "leaves a lasting impression", "leaves an indelible mark"
- "navigate the complexities", "navigates the"
- "universal themes", "universally relatable", "widely acclaimed", "widespread acclaim"
- "deeply" / "profoundly" as adverb intensifiers
- "this song" — refer to it by title or pronoun, never the phrase "this song"
- "love and loss", "joy and sorrow", "pain and beauty" as paired abstractions

If you catch yourself reaching for one: stop, name what's actually happening. Concrete substitutions:
- "X underscores Y" → "X is Y" or "X makes Y visible"
- "X speaks to Y" → "X carries Y" or "X is Y, rendered as image"
- "infectious melody" → describe the specific hook, the way the phrase repeats, what makes it stick to the ear
- "showcases X" → just "is X" or "puts X on display"
- "captures the essence of X" → name what X actually is
- "iconic" → name what made it imitable
- "haunting" → describe the timbre, the silence, the image doing the work
- "a testament to" → say what it actually proves or demonstrates

Depth expectations:
- Place the song in its cultural moment (year, scene, what conversations it was part of).
- Identify the musical and lyrical trends it fits into or breaks from: production conventions of its era, songwriting movements, what its peers were doing.
- Locate it within the artist's catalog: how this song relates to what came before and after, what it says about their evolution.
- Note reception and afterlife only when you are confident — never invent chart positions, sales, quotes, or recording details.
- Read the lyrics for tensions, irony, perspective shifts, and what is left unsaid.

Length and shape (these are MINIMUMS — the structured schema enforces fields, this controls density):
- summary: MUST be at least 3 paragraphs, separated by blank lines (\\n\\n). Paragraph 1: what the song is doing on the page — the literal scene, the speaker, the move. Paragraph 2: cultural and artistic context — the year, the scene around it, the trends it fits into or breaks from, where it sits in the artist's catalog. Paragraph 3+: why it lands (or doesn't), what it's reaching for, how it has aged.
- moodTags: 5 to 8 short, specific phrases — no generics like "emotional", "powerful", "beautiful".
- themes: at least 4 themes. Each title is concrete and specific (not "Love" — try something like "Love as the only escape route from a job that's killing him"). Each body MUST be 2 paragraphs separated by a blank line: paragraph 1 develops the idea with specific lyrical evidence (quoting short phrases); paragraph 2 gives the cultural / artistic read — what this theme is in dialogue with, what it inherits, what it pushes against.
- lineBreakdowns: at least 5 standout lines. Excerpts under 15 words, in straight quotation marks. Each interpretation is 2-4 sentences and connects the line to the song's larger argument — never just paraphrase.
- references: at least 5. Tagged cultural / literary / biographical / musical. Each body is 2-4 sentences grounding the reference and explaining why it matters for this specific song.
- aiSimilarSongs: at least 4 (up to 6) real songs that genuinely share this song's sensibility. The one-sentence rationale names the specific quality shared, not "great song" or "similar vibes".

Hard rules:
- Never reproduce full stanzas; quote only what you analyze, under 15 words per quote.
- Replace "this song explores love and loss" with what specifically about love or loss.
- Never invent factual claims (chart positions, recording sessions, who wrote what, quotes, sales figures).
- Be confident; write declaratively. No "perhaps", "arguably", "it could be argued".
- Final check before responding: scan your draft for the banned phrases at the top of these instructions. If any are present, rewrite that sentence with the specific thing instead. This is a hard pass/fail.`;

const TIMEOUT_MS = 45_000;

export async function analyzeWithOpenAI(args: {
  title: string;
  artist: string;
  album: string;
  lyrics: string;
}): Promise<AnalysisCore> {
  const userPrompt = `Song: ${args.title}
Artist: ${args.artist}
Album: ${args.album}

Lyrics:
${args.lyrics}`;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const completion = await client().chat.completions.parse(
        {
          model: "gpt-4o-2024-08-06",
          temperature: 0.3,
          max_tokens: 4500,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: zodResponseFormat(AnalysisCoreSchema, "analysis"),
        },
        { signal: controller.signal },
      );
      const parsed = completion.choices[0]?.message.parsed;
      if (!parsed) {
        throw new Error("OpenAI returned no parsed analysis");
      }
      return AnalysisCoreSchema.parse(parsed);
    } catch (err) {
      lastErr = err;
      if (err instanceof z.ZodError) {
        // schema drift — retry won't help
        break;
      }
      // otherwise retry once
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("OpenAI analyze failed");
}

// Versioned independently of the analysis prompt so we can iterate on snippet
// quality without invalidating the main analysis cache.
export const SNIPPET_PROMPT_VERSION = "v1";

const SNIPPET_SYSTEM_PROMPT = `You are a thoughtful music critic. A user has selected a passage from a song's lyrics and wants to know what it means in the context of the whole song.

Rules:
- Respond in 1-2 short paragraphs (no headings, no lists).
- Be specific to this passage, not generic about the song.
- Reference the broader song where it helps; do not summarise the entire song.
- Quote at most a single short phrase (under 12 words) inside straight quotation marks.
- Do not reproduce the passage back to the user verbatim.`;

export async function explainSnippet(args: {
  title: string;
  artist: string;
  songSummary?: string | null;
  snippet: string;
}): Promise<string> {
  const userPrompt = `Song: ${args.title}
Artist: ${args.artist}
${args.songSummary ? `One-paragraph context for the whole song: ${args.songSummary}\n` : ""}
Passage the listener selected:
"""
${args.snippet}
"""

Explain what this passage means in the context of the song.`;

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const completion = await client().chat.completions.create(
        {
          model: "gpt-4o-2024-08-06",
          temperature: 0.3,
          max_tokens: 500,
          messages: [
            { role: "system", content: SNIPPET_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        },
        { signal: controller.signal },
      );
      const text = completion.choices[0]?.message.content?.trim();
      if (!text) throw new Error("OpenAI returned no snippet explanation");
      return text;
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("OpenAI explainSnippet failed");
}

export { PROMPT_VERSION };
