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
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[70vh] transition-opacity duration-700"
        style={{
          background: `radial-gradient(60% 60% at 30% 0%, color-mix(in oklab, ${palette.primary} 35%, transparent), transparent 70%), radial-gradient(50% 50% at 80% 10%, color-mix(in oklab, ${palette.secondary} 30%, transparent), transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
