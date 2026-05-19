import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { lookupSyncedLyrics } from "@/lib/lrclib";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getTrack } from "@/lib/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z.object({ id: z.string().min(1).max(64) });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ id: url.searchParams.get("id") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { userId } = await auth();
  // lyrics calls hit a third-party API but no AI cost — reuse the recommendations
  // limiter (60/min) which has the right magnitude.
  const rate = await checkRateLimit(
    "recommendations",
    userId ?? getClientIp(req),
  );
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  try {
    const track = await getTrack(parsed.data.id);
    const title = track.name;
    const artist = track.artists[0]?.name ?? "";
    const album = track.album.name;
    const durationSeconds = Math.round(track.duration_ms / 1000);

    const result = await lookupSyncedLyrics({
      title,
      artist,
      album,
      durationSeconds,
    });

    if (!result) {
      return NextResponse.json({
        synced: null,
        plain: null,
        instrumental: false,
        source: null,
      });
    }

    return NextResponse.json({
      synced: result.synced,
      plain: result.plain,
      instrumental: result.instrumental,
      source: result.source,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lyrics failed";
    console.error("[lyrics]", message);
    return NextResponse.json(
      { synced: null, plain: null, instrumental: false, source: null },
    );
  }
}
