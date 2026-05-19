import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { parseInput } from "@/lib/input-parser";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  findTrackByIsrc,
  getTrack,
  searchTracks,
  type SpotifyTrack,
} from "@/lib/spotify";

const BodySchema = z.object({ input: z.string().min(1).max(500) });

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
  const rate = await checkRateLimit(
    "resolve",
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
    const parsedInput = parseInput(parsed.data.input);
    let track: SpotifyTrack | null = null;

    switch (parsedInput.kind) {
      case "spotify-track":
        track = await getTrack(parsedInput.id);
        break;
      case "isrc":
        track = await findTrackByIsrc(parsedInput.isrc);
        break;
      case "apple-music": {
        return NextResponse.json(
          {
            error:
              "Apple Music input is not supported yet — paste a Spotify URL, ISRC, or 'Song — Artist'.",
          },
          { status: 501 },
        );
      }
      case "free-text": {
        const results = await searchTracks(parsedInput.query, 1);
        track = results[0] ?? null;
        break;
      }
    }

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: track.id,
      isrc: track.external_ids?.isrc ?? null,
      name: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      album: track.album.name,
      releaseDate: track.album.release_date,
      image: track.album.images[0]?.url ?? null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error resolving input";
    const isAuth = message.includes("CLIENT_ID") || message.includes("auth");
    return NextResponse.json(
      { error: message },
      { status: isAuth ? 503 : 500 },
    );
  }
}
