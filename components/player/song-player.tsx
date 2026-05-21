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
      className="overflow-hidden rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] p-1 shadow-[inset_0_1px_0_var(--glass-highlight),0_0_0_1px_var(--glass-edge),0_30px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl"
    >
      <div ref={ref} className="min-h-[352px] overflow-hidden rounded-xl" />
    </div>
  );
}
