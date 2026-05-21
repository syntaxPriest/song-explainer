"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

import type { FeaturedTrack } from "@/lib/featured";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.2 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export function FeaturedRail({ tracks }: { tracks: FeaturedTrack[] }) {
  if (tracks.length === 0) return null;

  const visible = tracks.slice(0, 4);

  return (
    <section className="w-full">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted-foreground)]">
          Start with one of these
        </h2>
        <span className="text-xs text-[color:var(--color-muted-foreground)]">
          Tap any cover
        </span>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-x-10"
      >
        {visible.map((track) => (
          <motion.div key={track.id} variants={item}>
            <FeaturedCard track={track} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function FeaturedCard({ track }: { track: FeaturedTrack }) {
  return (
    <Link
      href={`/song/${track.id}`}
      className="group relative block focus:outline-none"
    >
      <div className="relative aspect-square">
        <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-[0_30px_60px_-25px_rgba(0,0,0,0.75)] ring-1 ring-white/8 transition-transform duration-500 will-change-transform group-hover:-translate-y-1.5 group-hover:scale-[1.02]">
          {track.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={track.imageUrl}
              alt={`${track.name} cover`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[color:var(--color-muted)]" />
          )}
          {/* Inner highlight — a fine top-edge gloss that reads as a
              physical bevel against the dark page. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px rgba(0,0,0,0.35)",
            }}
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="truncate text-[15px] font-semibold leading-tight tracking-tight">
          {track.name}
        </p>
        <p className="mt-1 truncate text-[13px] text-[color:var(--color-muted-foreground)]">
          {track.artist}
        </p>
      </div>
    </Link>
  );
}
