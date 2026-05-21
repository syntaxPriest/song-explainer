import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { getOrCreateAnalysis } from "@/lib/analysis";
import { LyricsNotFoundError } from "@/lib/lyrics";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ id: z.string().min(1).max(64) });

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

  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "1";

  try {
    const result = await getOrCreateAnalysis(parsed.data.id, { refresh });
    return NextResponse.json({
      analysis: result.analysis,
      cached: result.cached,
      trackKey: result.trackKey,
    });
  } catch (err) {
    if (err instanceof LyricsNotFoundError) {
      // Detailed provider errors go to the server log; the client gets
      // a clean payload it can pattern-match to render a tailored state.
      console.warn(
        `[analyze] lyrics not found for "${err.title}" by ${err.artist}: ${err.providerErrors.join(" | ")}`,
      );
      return NextResponse.json(
        {
          error: `We couldn't find lyrics for "${err.title}" by ${err.artist}.`,
          code: err.code,
          title: err.title,
          artist: err.artist,
        },
        { status: 404 },
      );
    }
    const message = err instanceof Error ? err.message : "Analysis failed";
    const status = inferStatus(message);
    console.error("[analyze] error:", message);
    return NextResponse.json({ error: message }, { status });
  }
}

function inferStatus(message: string): number {
  if (
    message.includes("OPENAI_API_KEY") ||
    message.includes("GENIUS_ACCESS_TOKEN") ||
    message.includes("SPOTIFY_CLIENT")
  ) {
    return 503;
  }
  if (message.includes("not found") || message.includes("no match")) {
    return 404;
  }
  return 500;
}
