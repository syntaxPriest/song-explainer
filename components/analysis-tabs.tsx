"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  ExternalLink,
  Lightbulb,
  ListMusic,
  Mic2,
  Music,
  Quote,
} from "lucide-react";

import {
  LyricLines,
  type LyricsPayload,
  type TrackContext,
} from "@/components/lyrics/lyric-lines";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Analysis } from "@/lib/schemas";

export type SpotifyRec = {
  id: string;
  name: string;
  artist: string;
  url: string;
  imageUrl: string | null;
};

const referenceCopy: Record<Analysis["references"][number]["type"], string> = {
  cultural: "Cultural",
  literary: "Literary",
  biographical: "Biographical",
  musical: "Musical",
};

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

export function AnalysisTabs({
  analysis,
  spotifyRecs = [],
  lyrics = null,
  lyricsLoading = false,
  trackContext = null,
}: {
  analysis: Analysis;
  spotifyRecs?: SpotifyRec[];
  lyrics?: LyricsPayload | null;
  lyricsLoading?: boolean;
  trackContext?: TrackContext | null;
}) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="overview" className="gap-2">
          <Music className="h-4 w-4" aria-hidden />
          Overview
        </TabsTrigger>
        <TabsTrigger value="lyrics" className="gap-2">
          <Mic2 className="h-4 w-4" aria-hidden />
          Lyrics
        </TabsTrigger>
        <TabsTrigger value="meaning" className="gap-2">
          <Lightbulb className="h-4 w-4" aria-hidden />
          Meaning
        </TabsTrigger>
        <TabsTrigger value="lines" className="gap-2">
          <Quote className="h-4 w-4" aria-hidden />
          Line-by-line
        </TabsTrigger>
        <TabsTrigger value="references" className="gap-2">
          <BookOpen className="h-4 w-4" aria-hidden />
          References
        </TabsTrigger>
        <TabsTrigger value="similar" className="gap-2">
          <ListMusic className="h-4 w-4" aria-hidden />
          Similar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <motion.div {...fade}>
          <p className="max-w-3xl text-lg leading-relaxed text-[color:var(--color-foreground)]">
            {analysis.summary}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {analysis.moodTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-3 py-1 text-sm"
                style={{
                  borderColor:
                    "color-mix(in oklab, var(--palette-primary, var(--color-primary)) 40%, transparent)",
                  color:
                    "color-mix(in oklab, var(--palette-accent, var(--color-foreground)) 80%, white)",
                  background:
                    "color-mix(in oklab, var(--palette-primary, var(--color-primary)) 12%, transparent)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </TabsContent>

      <TabsContent value="lyrics">
        <motion.div {...fade}>
          <LyricLines
            payload={lyrics}
            loading={lyricsLoading}
            trackContext={trackContext}
          />
        </motion.div>
      </TabsContent>

      <TabsContent value="meaning">
        <motion.div {...fade} className="space-y-6">
          {analysis.themes.map((theme) => (
            <section key={theme.title}>
              <h3 className="text-xl font-semibold">{theme.title}</h3>
              <p className="mt-2 leading-relaxed text-[color:var(--color-muted-foreground)]">
                {theme.body}
              </p>
            </section>
          ))}
        </motion.div>
      </TabsContent>

      <TabsContent value="lines">
        <motion.ol {...fade} className="space-y-6">
          {analysis.lineBreakdowns.map((line, idx) => (
            <li
              key={idx}
              className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-5"
            >
              <p className="font-serif text-lg italic">{line.excerpt}</p>
              <p className="mt-3 leading-relaxed text-[color:var(--color-muted-foreground)]">
                {line.interpretation}
              </p>
            </li>
          ))}
        </motion.ol>
      </TabsContent>

      <TabsContent value="references">
        <motion.div {...fade} className="grid gap-4 sm:grid-cols-2">
          {analysis.references.map((ref, idx) => (
            <article
              key={idx}
              className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-5"
            >
              <span className="text-xs uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
                {referenceCopy[ref.type]}
              </span>
              <h3 className="mt-1 text-lg font-semibold">{ref.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-muted-foreground)]">
                {ref.body}
              </p>
            </article>
          ))}
        </motion.div>
      </TabsContent>

      <TabsContent value="similar">
        <motion.div {...fade} className="space-y-8">
          {spotifyRecs.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
                Spotify recommendations
              </h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {spotifyRecs.map((rec) => (
                  <li key={rec.id}>
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3 transition-colors hover:border-[color:var(--palette-primary,var(--color-primary))]"
                    >
                      {rec.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rec.imageUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-[color:var(--color-muted)]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {rec.name}
                        </p>
                        <p className="truncate text-xs text-[color:var(--color-muted-foreground)]">
                          {rec.artist}
                        </p>
                      </div>
                      <ExternalLink
                        className="h-4 w-4 text-[color:var(--color-muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
              AI picks
            </h3>
            <ul className="mt-3 space-y-3">
              {analysis.aiSimilarSongs.map((song, idx) => {
                const Inner = (
                  <div className="flex gap-4">
                    {song.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={song.imageUrl}
                        alt=""
                        width={64}
                        height={64}
                        className="h-16 w-16 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded bg-[color:var(--color-muted)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-4">
                        <h4 className="text-lg font-semibold">{song.title}</h4>
                        <span className="shrink-0 text-sm text-[color:var(--color-muted-foreground)]">
                          {song.artist}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-muted-foreground)]">
                        {song.rationale}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li
                    key={idx}
                    className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-5"
                  >
                    {song.spotifyId ? (
                      <Link
                        href={`/song/${song.spotifyId}`}
                        className="block transition-colors hover:[&_h4]:text-[color:var(--palette-primary,var(--color-primary))]"
                      >
                        {Inner}
                      </Link>
                    ) : (
                      Inner
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </motion.div>
      </TabsContent>
    </Tabs>
  );
}
