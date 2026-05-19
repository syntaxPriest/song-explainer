import "server-only";
import { Ratelimit } from "@upstash/ratelimit";

import { getRedis } from "@/lib/redis";

export type RateLimitKind = "analyze" | "resolve" | "recommendations" | "saved";

const limiters = new Map<RateLimitKind, Ratelimit | null>();

function makeLimiter(kind: RateLimitKind): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const config: Record<RateLimitKind, { tokens: number; window: `${number} ${"s" | "m"}` }> = {
    // analyze hits OpenAI — tight
    analyze: { tokens: 10, window: "1 m" },
    // resolve is light — Spotify only
    resolve: { tokens: 30, window: "1 m" },
    // recs are cached upstream; cheap
    recommendations: { tokens: 60, window: "1 m" },
    // saved is per-user-action
    saved: { tokens: 30, window: "1 m" },
  };
  const cfg = config[kind];
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.tokens, cfg.window),
    prefix: `rl:${kind}`,
    analytics: false,
  });
}

function getLimiter(kind: RateLimitKind): Ratelimit | null {
  if (!limiters.has(kind)) limiters.set(kind, makeLimiter(kind));
  return limiters.get(kind) ?? null;
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/**
 * Returns ok=true when no Upstash is configured (graceful no-op for dev).
 * Caller picks the identifier — userId when authed, IP when not.
 */
export async function checkRateLimit(
  kind: RateLimitKind,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(kind);
  if (!limiter) return { ok: true };
  const result = await limiter.limit(identifier);
  if (result.success) return { ok: true };
  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return { ok: false, retryAfterSeconds };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "anonymous";
}
