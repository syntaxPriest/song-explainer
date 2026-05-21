"use client";

import { useEffect, useState } from "react";

import { extractPalette, type Palette } from "@/lib/palette";

const FALLBACK: Palette = {
  primary: "#7c3aed",
  secondary: "#db2777",
  accent: "#f5d0fe",
};

export function PaletteProvider({
  imageUrl,
  children,
}: {
  imageUrl: string | null;
  children: React.ReactNode;
}) {
  const [palette, setPalette] = useState<Palette>(FALLBACK);

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;
    extractPalette(imageUrl)
      .then((p) => {
        if (!cancelled) setPalette(p);
      })
      .catch(() => {
        // keep fallback
      });
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  // Soft neon glow: concentrated washes at the corners, true black through
  // the middle. The palette pokes through as a hint of color, not a flood.
  // Aim is Apple-Music-Now-Playing: you sense the album's color before you
  // see it.
  const neonOverlay = `
    radial-gradient(45% 35% at 15% 0%, color-mix(in oklab, ${palette.primary} 22%, transparent) 0%, transparent 70%),
    radial-gradient(40% 35% at 92% 12%, color-mix(in oklab, ${palette.secondary} 18%, transparent) 0%, transparent 70%),
    radial-gradient(30% 22% at 50% -3%, color-mix(in oklab, ${palette.accent} 12%, transparent) 0%, transparent 70%)
  `;

  return (
    <div
      style={
        {
          "--palette-primary": palette.primary,
          "--palette-secondary": palette.secondary,
          "--palette-accent": palette.accent,
        } as React.CSSProperties
      }
      className="relative"
    >
      {/* Layer 1: the album art itself, smeared into amorphous color through
          a heavy blur. Organic neon shapes that match the actual cover, not
          a stylized approximation.
          NB: no motion wrapper — Framer's SSR'd `initial` styles would leave
          the backdrop at opacity:0 if hydration didn't fire. Plain CSS opacity
          animation on the inner imgs handles the fade-in safely. */}
      {imageUrl ? (
        <div
          key={`art-${imageUrl}`}
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
        >
          {/* eslint-disable @next/next/no-img-element */}
          {/* Single very-soft wash of the cover. The blur is heavier and the
              opacity is way down — the cover should suggest color, not
              dominate the page. */}
          <img
            src={imageUrl}
            alt=""
            className="absolute -top-1/4 left-1/2 h-[80%] w-[80%] -translate-x-1/2 scale-[1.2] object-cover"
            style={{
              filter: "blur(160px) saturate(140%)",
              opacity: 0.18,
              animation: "neon-fade-primary 1.4s ease-out",
            }}
          />
          {/* eslint-enable @next/next/no-img-element */}
        </div>
      ) : null}

      {/* Layer 2: palette-tinted neon gradients. CSS-driven drift so the
          gradient is visible even if no JS runs. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-screen"
        style={{
          background: neonOverlay,
          animation: "neon-drift 18s ease-in-out infinite",
        }}
      />

      {/* Layer 3: dark scrim that fades up from the bottom so foreground
          text doesn't fight the neon for contrast. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-[color:var(--color-background)] via-[color:var(--color-background)]/40 to-transparent"
      />

      {children}
    </div>
  );
}
