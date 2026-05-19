"use client";

import { useEffect, useRef } from "react";

import { usePlayer } from "@/components/player/player-context";

/**
 * Visual slot for the Spotify embed. The actual iframe is created by
 * {@link SpotifyPlayerProvider} via the IFrame API, replacing the div
 * we mount here.
 */
export function SongPlayer() {
  const { attachIframeHost } = usePlayer();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    attachIframeHost(ref.current);
    return () => attachIframeHost(null);
  }, [attachIframeHost]);

  return (
    <div
      role="region"
      aria-label="Spotify player"
      className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] shadow-lg"
    >
      <div ref={ref} className="min-h-[352px]" />
    </div>
  );
}
