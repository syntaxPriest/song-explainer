"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
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

// Staggered children for tab content. Each card fades + rises with a slight
// delay so the panel reveals like an Apple Music card stack instead of
// snapping in.
const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

// Card class used everywhere — picks up the glass token surface defined
// in globals.css. The data-card class adds a hover lift via Tailwind.
const cardClass =
  "rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] p-5 shadow-[inset_0_1px_0_var(--glass-highlight),0_0_0_1px_var(--glass-edge),0_20px_40px_-24px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-0.5";

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
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p
            variants={item}
            className="max-w-3xl whitespace-pre-wrap text-lg leading-relaxed text-[color:var(--color-foreground)]"
          >
            {analysis.summary}
          </motion.p>
          <motion.div variants={item} className="mt-6 flex flex-wrap gap-2">
            {analysis.moodTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-3 py-1.5 text-sm backdrop-blur"
                style={{
                  borderColor:
                    "color-mix(in oklab, var(--palette-primary, var(--color-primary)) 45%, transparent)",
                  color:
                    "color-mix(in oklab, var(--palette-accent, var(--color-foreground)) 80%, white)",
                  background:
                    "color-mix(in oklab, var(--palette-primary, var(--color-primary)) 14%, transparent)",
                  boxShadow:
                    "inset 0 1px 0 var(--glass-highlight), 0 0 0 1px var(--glass-edge)",
                }}
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </TabsContent>

      <TabsContent value="lyrics">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <LyricLines
              payload={lyrics}
              loading={lyricsLoading}
              trackContext={trackContext}
            />
          </motion.div>
        </motion.div>
      </TabsContent>

      <TabsContent value="meaning">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {analysis.themes.map((theme) => (
            <motion.section
              key={theme.title}
              variants={item}
              className={cardClass}
            >
              <h3 className="text-xl font-semibold tracking-tight">
                {theme.title}
              </h3>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed text-[color:var(--color-muted-foreground)]">
                {theme.body}
              </p>
            </motion.section>
          ))}
        </motion.div>
      </TabsContent>

      <TabsContent value="lines">
        <motion.ol
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {analysis.lineBreakdowns.map((line, idx) => (
            <motion.li
              key={idx}
              variants={item}
              className={cardClass}
            >
              <p
                className="font-serif text-lg italic"
                style={{
                  color:
                    "color-mix(in oklab, var(--palette-accent, var(--color-foreground)) 80%, white)",
                }}
              >
                {line.excerpt}
              </p>
              <p className="mt-3 leading-relaxed text-[color:var(--color-muted-foreground)]">
                {line.interpretation}
              </p>
            </motion.li>
          ))}
        </motion.ol>
      </TabsContent>

      <TabsContent value="references">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2"
        >
          {analysis.references.map((ref, idx) => (
            <motion.article key={idx} variants={item} className={cardClass}>
              <span
                className="text-xs uppercase tracking-[0.18em]"
                style={{
                  color:
                    "color-mix(in oklab, var(--palette-primary, var(--color-primary)) 70%, white)",
                }}
              >
                {referenceCopy[ref.type]}
              </span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                {ref.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-muted-foreground)]">
                {ref.body}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </TabsContent>

      <TabsContent value="similar">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-10"
        >
          {spotifyRecs.length > 0 ? (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
                Spotify recommendations
              </h3>
              <motion.ul
                variants={container}
                initial="hidden"
                animate="show"
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                {spotifyRecs.map((rec) => (
                  <motion.li key={rec.id} variants={item}>
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`group flex items-center gap-3 ${cardClass} !p-3`}
                    >
                      {rec.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rec.imageUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-cover shadow-md"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-[color:var(--color-muted)]" />
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
                  </motion.li>
                ))}
              </motion.ul>
            </section>
          ) : null}

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
              AI picks
            </h3>
            <motion.ul
              variants={container}
              initial="hidden"
              animate="show"
              className="mt-4 space-y-3"
            >
              {analysis.aiSimilarSongs.map((song, idx) => {
                const Inner = (
                  <div className="flex gap-4">
                    {song.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={song.imageUrl}
                        alt=""
                        width={72}
                        height={72}
                        className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover shadow-md"
                      />
                    ) : (
                      <div className="h-[72px] w-[72px] shrink-0 rounded-xl bg-[color:var(--color-muted)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-4">
                        <h4 className="text-lg font-semibold tracking-tight">
                          {song.title}
                        </h4>
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
                  <motion.li key={idx} variants={item} className={cardClass}>
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
                  </motion.li>
                );
              })}
            </motion.ul>
          </section>
        </motion.div>
      </TabsContent>
    </Tabs>
  );
}
