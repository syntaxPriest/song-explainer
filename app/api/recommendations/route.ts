import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getRecommendations } from "@/lib/spotify";

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
    const tracks = await getRecommendations(parsed.data.id);
    const recs = tracks.map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artists.map((a) => a.name).join(", "),
      imageUrl: t.album.images[1]?.url ?? t.album.images[0]?.url ?? null,
      url: `https://open.spotify.com/track/${t.id}`,
    }));
    return NextResponse.json({ recommendations: recs });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Recommendations failed";
    console.error("[recommendations]", message);
    // never block the page on this — return empty list
    return NextResponse.json({ recommendations: [] });
  }
}
