import "server-only";
import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

function makeClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  return new PrismaClient({ log: ["error"] });
}

export const prisma: PrismaClient | null =
  globalThis.__prisma ?? makeClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalThis.__prisma = prisma;
}
