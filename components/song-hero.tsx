"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Disc } from "lucide-react";

import { SaveButton } from "@/components/save-button";

type Props = {
  trackKey: string;
  spotifyId: string;
  name: string;
  artist: string;
  album: string;
  releaseYear: string;
  imageUrl: string | null;
};

export function SongHero({
  trackKey,
  spotifyId,
  name,
  artist,
  album,
  releaseYear,
  imageUrl,
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
      // sticky only on lg+: on smaller screens a 280px hero takes the whole
      // viewport and would block all scrolling. The backdrop tinting keeps
      // text readable when analysis content scrolls under it.
      className="lg:sticky lg:top-16 lg:z-30 lg:-mx-2 lg:rounded-xl lg:bg-[color:var(--color-background)]/85 lg:px-2 lg:py-3 lg:backdrop-blur"
    >
      <div className="grid gap-8 sm:grid-cols-[220px_1fr] sm:items-end">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${album} cover art`}
            width={220}
            height={220}
            className="aspect-square w-full rounded-lg object-cover shadow-2xl"
            priority
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-[color:var(--color-muted)]">
            <Disc
              className="h-14 w-14 text-[color:var(--color-muted-foreground)]"
              aria-hidden
            />
          </div>
        )}

        <div>
          <p className="text-sm uppercase tracking-wide text-[color:var(--color-muted-foreground)]">
            Song
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">
            {name}
          </h1>
          <p className="mt-2 text-base text-[color:var(--color-foreground)] sm:text-lg">
            {artist}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[color:var(--color-muted-foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <Disc className="h-4 w-4" aria-hidden />
              {album}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" aria-hidden />
              {releaseYear}
            </span>
          </div>
          <div className="mt-4">
            <SaveButton
              trackKey={trackKey}
              spotifyId={spotifyId}
              trackName={name}
              artist={artist}
              imageUrl={imageUrl}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
