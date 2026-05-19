import "server-only";

import { prisma } from "@/lib/db";
import { AnalysisSchema, type Analysis } from "@/lib/schemas";

export async function getCachedAnalysis(
  trackKey: string,
  promptVersion: string,
): Promise<Analysis | null> {
  if (!prisma) return null;
  try {
    const row = await prisma.analysis.findUnique({
      where: { trackKey_promptVersion: { trackKey, promptVersion } },
    });
    if (!row) return null;
    return AnalysisSchema.parse(row.data);
  } catch (err) {
    console.warn("[cache] read failed, treating as miss:", err);
    return null;
  }
}

export async function putCachedAnalysis(
  trackKey: string,
  promptVersion: string,
  data: Analysis,
): Promise<void> {
  if (!prisma) return;
  try {
    await prisma.analysis.upsert({
      where: { trackKey_promptVersion: { trackKey, promptVersion } },
      create: { trackKey, promptVersion, data },
      update: { data },
    });
  } catch (err) {
    console.warn("[cache] write failed, continuing:", err);
  }
}
