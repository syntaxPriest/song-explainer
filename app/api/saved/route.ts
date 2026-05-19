import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

async function enforceRateLimit(userId: string) {
  const rate = await checkRateLimit("saved", userId);
  if (rate.ok) return null;
  return NextResponse.json(
    { error: "Rate limit exceeded" },
    {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfterSeconds) },
    },
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SaveBodySchema = z.object({
  trackKey: z.string().min(1).max(64),
  spotifyId: z.string().min(1).max(64),
  trackName: z.string().min(1).max(300),
  artist: z.string().min(1).max(300),
  imageUrl: z.string().url().nullable().optional(),
});

const DeleteQuerySchema = z.object({ trackKey: z.string().min(1).max(64) });

function dbMissingResponse() {
  return NextResponse.json(
    { error: "DATABASE_URL not configured" },
    { status: 503 },
  );
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!prisma) return dbMissingResponse();

  const items = await prisma.savedAnalysis.findMany({
    where: { userId },
    orderBy: { savedAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(userId);
  if (limited) return limited;
  if (!prisma) return dbMissingResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = SaveBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const item = await prisma.savedAnalysis.upsert({
    where: {
      userId_trackKey: { userId, trackKey: parsed.data.trackKey },
    },
    create: { userId, ...parsed.data, imageUrl: parsed.data.imageUrl ?? null },
    update: {
      spotifyId: parsed.data.spotifyId,
      trackName: parsed.data.trackName,
      artist: parsed.data.artist,
      imageUrl: parsed.data.imageUrl ?? null,
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimit(userId);
  if (limited) return limited;
  if (!prisma) return dbMissingResponse();

  const url = new URL(req.url);
  const parsed = DeleteQuerySchema.safeParse({
    trackKey: url.searchParams.get("trackKey"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid trackKey" }, { status: 400 });
  }

  await prisma.savedAnalysis
    .delete({
      where: {
        userId_trackKey: { userId, trackKey: parsed.data.trackKey },
      },
    })
    .catch(() => {
      // already gone — treat as success
    });
  return NextResponse.json({ ok: true });
}
