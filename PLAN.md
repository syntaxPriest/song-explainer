# Song Explainer — Project Plan

## Vision

A web app that demystifies song lyrics. A user pastes a song title + artist, a Spotify or Apple Music link, or an ISRC code, and receives a colorful, tabbed breakdown of what the song is actually about — themes, line-by-line meaning, cultural references, and recommended songs in the same vein. Built for music fans who want to go deeper than a casual listen.

## Assumed Platform

Web first, built with Next.js. Easier to share via link (every analysis gets a public URL with OG tags), faster to iterate, and tabs feel natural in a desktop/mobile-web layout. A React Native/Expo version can follow once the core is validated.

## User Flow

1. Landing page with a single prominent search field
2. User pastes a Spotify URL, Apple Music URL, ISRC, or types `Song name — Artist`
3. App detects input type, resolves to a canonical track (Spotify ID + ISRC)
4. Track metadata loads instantly (cached); analysis streams in
5. Results page renders tabs:
   - **Overview** — album art, artist, year, 1-paragraph summary, mood tags, sticky Spotify player
   - **Meaning** — long-form thematic analysis
   - **Line-by-line** — stanza-by-stanza annotations
   - **References** — cultural, literary, biographical, musical callouts
   - **Similar Songs** — Spotify recommendations + AI picks with rationale
6. User can save the analysis (account required), share via link, or analyze another song

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 15 + TypeScript | App Router, RSC, easy Vercel deploy |
| UI kit | Tailwind + shadcn/ui | Fast, customizable, looks good out of the box |
| Icons | Lucide (`lucide-react`) | Consistent line-icon set; ships with shadcn. Avoid the `Sparkle`/`Sparkles` glyph — overused AI cliché |
| Animation | Framer Motion | Tab transitions, micro-interactions |
| AI | OpenAI GPT-4o | Structured outputs, strong literary analysis |
| Music API | Spotify Web API | Largest catalog, free Client Credentials flow |
| Lyrics | Musixmatch (prod) / Genius (dev) | Musixmatch licensed; Genius easier for prototyping |
| DB | Postgres (Supabase) | Cache analyses, store user libraries |
| Cache | Upstash Redis | Hot path for repeat lookups |
| Auth | Clerk | Drop-in, social login |
| Hosting | Vercel | Native Next.js, edge runtime where useful |

## Core Architectural Decisions

**Cache aggressively.** OpenAI analysis is expensive and slow. Every analyzed song is stored in Postgres keyed by ISRC + prompt version. Subsequent visitors get instant results. Redis caches Spotify metadata for 24h.

**Stream the analysis.** First-time analyses take ~10–20s. Use OpenAI streaming and render tabs as data lands — Overview first (from metadata), then Meaning, then Line-by-line.

**Structured AI output.** Use OpenAI's JSON schema mode. The schema directly maps to tab UI, so there's no fragile string parsing. Schema lives in `lib/schemas.ts` and is the single source of truth for shape.

**Album-art driven palette.** Extract dominant colors from the album art on the client and use them as gradient accents per song. Every song gets a unique look without any manual theming.

**ISRC as canonical ID.** Cross-platform identifier — an Apple Music link and a Spotify link to the same song hit the same cached analysis.

## Critical Risk: Lyrics Licensing

Lyrics are copyrighted. Reproducing them in full requires a license from the rights holders, typically obtained via aggregators like Musixmatch or LyricFind. Genius's terms allow display in some cases but commercial use is restricted. Three strategies, in order of preference:

1. **License via Musixmatch.** Commercial-friendly. Paid tier required for full lyrics display. Recommended for production.
2. **Snippet-only display.** Show short quoted excerpts inline with the analysis (fair use for criticism/commentary). Don't show the full lyric sheet.
3. **No lyric display at all.** Show only the AI's analysis, themes, and references. Most defensible legally; weaker UX.

For MVP: strategy 2 — quote short excerpts (under 15 words each, in quotation marks) within the line-by-line tab, no full lyric sheet. Upgrade to Musixmatch licensing before any paid launch.

## Feature Modules

### Smart input
Parser detects URL (Spotify or Apple Music), ISRC, or free text. Free text uses Spotify search with autocomplete dropdown (debounced 300ms). URLs and ISRCs lookup directly.

### Analysis engine
Server route accepts a Spotify track ID, fetches lyrics, calls OpenAI with a structured output schema, streams response to client. Prompt is versioned — bumping the version invalidates cache.

### Tabbed display
Five tabs as listed above. Each is its own component fed from the same analysis object. Animated transitions. Mobile: horizontal scroll on tab bar.

### Recommendations
Spotify `/recommendations` endpoint seeded with the current track ID + audio features. Layered on top: AI returns 3–5 "deep cut" suggestions with a one-line rationale each. Clicking any recommendation kicks off a new analysis.

### Library (auth required)
Saved analyses, recently viewed, public profile of liked songs (optional).

### Share
Every analysis has a public URL (`/song/[isrc]`) with rich OG tags (album art, summary). Designed to be linkable.

## UI/UX Direction

Colorful but not noisy. The visual identity emerges from each song's album art via extracted color palette, applied as a soft gradient background and accent on tab indicators and interactive elements. Typography is editorial — think a music magazine feature article rather than a SaaS dashboard. Generous whitespace. Album art is hero-sized. Sticky player at bottom plays a 30s preview or full embed for premium Spotify users.

Dark mode is the default and primary design target. Light mode supported.

Iconography uses Lucide throughout (`lucide-react`) for a consistent line-weight feel that pairs with shadcn. The `Sparkle`/`Sparkles` icon is intentionally avoided — it has become a generic "AI" signifier; we prefer icons that mean something specific to the surface (e.g. `Wand2` for the analyze action, `Music`/`Disc3` for playback, `Lightbulb` for interpretations, `BookOpen` for references).

## Phases & Milestones

**Phase 1 — Skeleton (Week 1).** Next.js + Tailwind + shadcn setup. Spotify Client Credentials flow. Search + resolve. Basic results page with hardcoded analysis.

**Phase 2 — Analysis (Week 2).** Genius integration. OpenAI with structured outputs. Postgres caching. Real analysis rendering in tabs.

**Phase 3 — Polish (Week 3).** Color extraction. Animations. Recommendations tab. Auth + saved library.

**Phase 4 — Launch prep (Week 4).** Rate limiting. Error states. SEO/OG. Analytics. Swap Genius for Musixmatch.

## Open Questions

- Do you want Apple Music as a first-class input from day 1, or Spotify-only for MVP?
- Mobile RN/Expo version — parallel from start, or sequential after web launches?
- Monetization — free with rate limits, premium tier, or fully free?
- User-submitted interpretations / community angle, or pure AI?
