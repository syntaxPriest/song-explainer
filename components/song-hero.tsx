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
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      className="lg:sticky lg:top-16 lg:z-30 lg:-mx-3 lg:rounded-3xl lg:border lg:border-[color:var(--glass-border)] lg:bg-[color:var(--glass-bg)] lg:p-4 lg:shadow-[inset_0_1px_0_var(--glass-highlight),0_0_0_1px_var(--glass-edge),0_20px_50px_-20px_rgba(0,0,0,0.6)] lg:backdrop-blur-2xl"
    >
      <div className="grid gap-8 sm:grid-cols-[220px_1fr] sm:items-end">
        {imageUrl ? (
          <div className="relative">
            {/* Soft palette-tinted glow behind the cover. */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 rounded-2xl opacity-70 blur-2xl"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 60%, var(--palette-primary, #7c3aed), transparent 70%)",
              }}
            />
            <Image
              src={imageUrl}
              alt={`${album} cover art`}
              width={220}
              height={220}
              className="aspect-square w-full rounded-2xl object-cover shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
              priority
            />
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] backdrop-blur-xl">
            <Disc
              className="h-14 w-14 text-[color:var(--color-muted-foreground)]"
              aria-hidden
            />
          </div>
        )}

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted-foreground)]">
            Song
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">
            {name}
          </h1>
          <p
            className="mt-2 text-base font-medium sm:text-lg"
            style={{
              color:
                "color-mix(in oklab, var(--palette-accent, var(--color-foreground)) 75%, white)",
            }}
          >
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
