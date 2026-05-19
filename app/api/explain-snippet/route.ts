import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { getCachedAnalysis } from "@/lib/cache";
import { explainSnippet, SNIPPET_PROMPT_VERSION } from "@/lib/openai";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getRedis } from "@/lib/redis";
import { PROMPT_VERSION } from "@/lib/schemas";
import { hashSnippet } from "@/lib/snippet";
import { getTrack } from "@/lib/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  id: z.string().min(1).max(64),
  lines: z
    .array(z.object({ ms: z.number().nonnegative().optional(), text: z.string() }))
    .min(1)
    .max(50),
});

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { id, lines } = parsed.data;

  // Strip blank lines and trim
  const cleaned = lines
    .map((l) => ({ text: l.text.trim() }))
    .filter((l) => l.text.length > 0);
  if (cleaned.length === 0) {
    return NextResponse.json({ error: "Empty selection" }, { status: 400 });
  }

  const { userId } = await auth();
  const identifier = userId ?? getClientIp(req);
  const rate = await checkRateLimit("analyze", identifier);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded, try again in a moment" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  try {
    const track = await getTrack(id);
    const title = track.name;
    const artist = track.artists.map((a) => a.name).join(", ");
    const trackKey = track.external_ids?.isrc ?? track.id;

    const snippetHash = hashSnippet(cleaned);
    const cacheKey = `explain:${trackKey}:${snippetHash}:${SNIPPET_PROMPT_VERSION}`;

    const redis = getRedis();
    if (redis) {
      try {
        const hit = await redis.get<string>(cacheKey);
        if (hit && typeof hit === "string") {
          return NextResponse.json({ explanation: hit, cached: true });
        }
      } catch (err) {
        console.warn("[explain] cache read failed:", err);
      }
    }

    const analysis = await getCachedAnalysis(trackKey, PROMPT_VERSION);
    const explanation = await explainSnippet({
      title,
      artist,
      songSummary: analysis?.summary ?? null,
      snippet: cleaned.map((l) => l.text).join("\n"),
    });

    if (redis) {
      try {
        await redis.set(cacheKey, explanation, { ex: CACHE_TTL_SECONDS });
      } catch (err) {
        console.warn("[explain] cache write failed:", err);
      }
    }

    return NextResponse.json({ explanation, cached: false });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Explain failed";
    const status =
      message.includes("OPENAI_API_KEY") || message.includes("SPOTIFY_CLIENT")
        ? 503
        : 500;
    console.error("[explain]", message);
    return NextResponse.json({ error: message }, { status });
  }
}
