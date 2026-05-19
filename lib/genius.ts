import "server-only";
import { z } from "zod";

const SearchResponseSchema = z.object({
  response: z.object({
    hits: z.array(
      z.object({
        result: z.object({
          id: z.number(),
          url: z.string().url(),
          full_title: z.string(),
          primary_artist: z.object({ name: z.string() }),
        }),
      }),
    ),
  }),
});

export type GeniusHit = {
  id: number;
  url: string;
  fullTitle: string;
  artist: string;
};

async function geniusFetch<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  if (!token) {
    throw new Error("GENIUS_ACCESS_TOKEN is not set");
  }
  const res = await fetch(`https://api.genius.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Genius request failed: ${res.status} ${path}`);
  }
  return schema.parse(await res.json());
}

export async function searchGenius(query: string): Promise<GeniusHit | null> {
  const qs = new URLSearchParams({ q: query });
  const data = await geniusFetch(
    `/search?${qs.toString()}`,
    SearchResponseSchema,
  );
  const first = data.response.hits[0];
  if (!first) return null;
  return {
    id: first.result.id,
    url: first.result.url,
    fullTitle: first.result.full_title,
    artist: first.result.primary_artist.name,
  };
}

/**
 * Dev-only lyrics scraper. Genius does not expose lyrics through its API.
 * In production, swap to Musixmatch (Phase 4) before any public launch.
 */
export async function fetchLyricsFromGeniusPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      // mimic a real browser; Genius blocks default fetch UAs
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      Accept: "text/html",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Genius page fetch failed: ${res.status}`);
  }
  const html = await res.text();
  return extractLyricsFromHtml(html);
}

function extractLyricsFromHtml(html: string): string {
  // Genius wraps lyrics in <div data-lyrics-container="true">...</div>, but
  // the container contains nested divs/spans for formatting (annotation
  // tooltips, embedded references, etc). A simple non-greedy regex stops at
  // the first inner </div> and silently returns empty text. Walk the HTML
  // and balance div tags to capture the full container.
  const openRe = /<div[^>]+data-lyrics-container="true"[^>]*>/gi;
  const parts: string[] = [];
  let openMatch: RegExpExecArray | null;
  while ((openMatch = openRe.exec(html)) !== null) {
    const contentStart = openMatch.index + openMatch[0].length;
    const end = findBalancedDivEnd(html, contentStart);
    if (end > contentStart) {
      parts.push(html.slice(contentStart, end));
    }
    openRe.lastIndex = end;
  }
  if (parts.length === 0) {
    throw new Error("Lyrics container not found on Genius page");
  }
  const text = parts
    .join("\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (text.length < 30) {
    throw new Error("Lyrics extraction produced empty/short text");
  }
  return text;
}

/**
 * Given an index just past a `<div ...>` open tag, returns the index of the
 * matching `</div>` (i.e. the index where that close tag starts). Walks the
 * HTML balancing nested div opens/closes.
 */
function findBalancedDivEnd(html: string, start: number): number {
  const tagRe = /<(\/)?div\b[^>]*>/gi;
  tagRe.lastIndex = start;
  let depth = 1;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    if (m[1]) {
      depth--;
      if (depth === 0) return m.index;
    } else {
      depth++;
    }
  }
  return html.length;
}

export async function getLyricsForTrack(
  title: string,
  artist: string,
): Promise<{ lyrics: string; source: string }> {
  const hit = await searchGenius(`${title} ${artist}`);
  if (!hit) {
    throw new Error(`Genius found no match for "${title}" by ${artist}`);
  }
  const lyrics = await fetchLyricsFromGeniusPage(hit.url);
  return { lyrics, source: hit.url };
}
