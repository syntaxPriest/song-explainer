"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Music2, Wand2, X } from "lucide-react";

import { usePlayer } from "@/components/player/player-context";
import {
  SnippetPanel,
  type SnippetState,
} from "@/components/lyrics/snippet-panel";
import { Button } from "@/components/ui/button";

export type SyncedLine = { ms: number; text: string };

export type LyricsPayload = {
  synced: SyncedLine[] | null;
  plain: string | null;
  instrumental: boolean;
  source: string | null;
};

export type TrackContext = {
  spotifyId: string;
  title: string;
  artist: string;
};

type Props = {
  payload: LyricsPayload | null;
  loading: boolean;
  trackContext: TrackContext | null;
};

type Selection = { anchor: number; focus: number } | null;

export function LyricLines({ payload, loading, trackContext }: Props) {
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-[color:var(--color-muted-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading lyrics…
      </div>
    );
  }

  if (!payload || (!payload.synced && !payload.plain)) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[color:var(--color-border)] p-10 text-center">
        <Music2
          className="h-7 w-7 text-[color:var(--color-muted-foreground)]"
          aria-hidden
        />
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          No lyrics found for this track.
        </p>
      </div>
    );
  }

  if (payload.instrumental) {
    return (
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6 text-center">
        <p className="text-base">Instrumental — no lyrics for this track.</p>
      </div>
    );
  }

  if (payload.synced && payload.synced.length > 0) {
    return <SelectableLyrics lines={payload.synced} synced trackContext={trackContext} />;
  }

  const plainLines = (payload.plain ?? "")
    .split(/\r?\n/)
    .map((text) => ({ ms: 0, text }));
  return (
    <SelectableLyrics lines={plainLines} synced={false} trackContext={trackContext} />
  );
}

function SelectableLyrics({
  lines,
  synced,
  trackContext,
}: {
  lines: SyncedLine[];
  synced: boolean;
  trackContext: TrackContext | null;
}) {
  const { position, seek } = usePlayer();
  const containerRef = useRef<HTMLOListElement | null>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const currentIndex = useMemo(
    () => (synced ? binarySearchActive(lines, position) : -1),
    [synced, lines, position],
  );

  const [selection, setSelection] = useState<Selection>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [snippetState, setSnippetState] = useState<SnippetState | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (currentIndex < 0) return;
    const el = itemRefs.current[currentIndex];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIndex]);

  const selectionRange = useMemo(() => {
    if (!selection) return null;
    const start = Math.min(selection.anchor, selection.focus);
    const end = Math.max(selection.anchor, selection.focus);
    return { start, end };
  }, [selection]);

  const selectedLines = useMemo(() => {
    if (!selectionRange) return [] as SyncedLine[];
    return lines
      .slice(selectionRange.start, selectionRange.end + 1)
      .filter((l) => l.text.trim().length > 0);
  }, [selectionRange, lines]);

  const excerptText = useMemo(
    () => selectedLines.map((l) => l.text).join("\n"),
    [selectedLines],
  );

  const handleLineClick = useCallback(
    (idx: number, e: React.MouseEvent) => {
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        // explicit extend
        setSelection((prev) =>
          prev
            ? { anchor: prev.anchor, focus: idx }
            : { anchor: idx, focus: idx },
        );
        return;
      }
      if (!selection) {
        // start fresh
        setSelection({ anchor: idx, focus: idx });
        if (synced) seek(lines[idx]?.ms ?? 0);
        return;
      }
      // selection exists — second tap extends to this line, third+ tap also extends
      setSelection({ anchor: selection.anchor, focus: idx });
    },
    [selection, synced, seek, lines],
  );

  const clearSelection = useCallback(() => setSelection(null), []);

  const explain = useCallback(async () => {
    if (!trackContext || selectedLines.length === 0) return;
    setPanelOpen(true);
    setSnippetState({ status: "loading" });
    try {
      const res = await fetch("/api/explain-snippet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: trackContext.spotifyId,
          lines: selectedLines.map((l) => ({ ms: l.ms, text: l.text })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        explanation?: string;
        cached?: boolean;
        error?: string;
      };
      if (!res.ok || !data.explanation) {
        throw new Error(data.error ?? `Explain failed (${res.status})`);
      }
      setSnippetState({
        status: "ready",
        explanation: data.explanation,
        cached: Boolean(data.cached),
      });
    } catch (err) {
      setSnippetState({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [trackContext, selectedLines]);

  // re-fetch when retry attempted
  useEffect(() => {
    if (attempt === 0) return;
    explain();
  }, [attempt, explain]);

  const inSelection = (idx: number) =>
    !!selectionRange && idx >= selectionRange.start && idx <= selectionRange.end;

  const selectionLabel = selectionRange
    ? selectionRange.start === selectionRange.end
      ? "1 line selected"
      : `${selectionRange.end - selectionRange.start + 1} lines selected`
    : null;

  return (
    <div className="relative">
      <AnimatePresence>
        {selectionRange ? (
          <motion.div
            key="toolbar"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="sticky top-2 z-10 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-full border border-[color:var(--glass-border-strong)] bg-[color:var(--glass-bg-strong)] px-4 py-2 shadow-[inset_0_1px_0_var(--glass-highlight),0_0_0_1px_var(--glass-edge),0_12px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
          >
            <p className="text-sm text-[color:var(--color-muted-foreground)]">
              {selectionLabel}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={explain}
                disabled={!trackContext || selectedLines.length === 0}
              >
                <Wand2 className="h-4 w-4" aria-hidden />
                Explain selection
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                <X className="h-4 w-4" aria-hidden />
                Clear
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] shadow-[inset_0_1px_0_var(--glass-highlight),0_0_0_1px_var(--glass-edge),0_20px_40px_-24px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        {!synced ? (
          <p className="px-5 pt-4 text-xs text-[color:var(--color-muted-foreground)]">
            No synced timing — plain lyrics. Selection + explain still work.
          </p>
        ) : null}
        <ol
          ref={containerRef}
          className="max-h-[520px] space-y-0.5 overflow-y-auto px-3 py-4 [mask-image:linear-gradient(180deg,transparent,black_5%,black_95%,transparent)]"
        >
          {lines.map((line, idx) => {
            const isActive = synced && idx === currentIndex;
            const isSelected = inSelection(idx);
            const text = line.text.trim();
            return (
              <li
                key={`${line.ms}-${idx}`}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
              >
                <button
                  type="button"
                  onClick={(e) => handleLineClick(idx, e)}
                  className={
                    "block w-full rounded-xl px-4 py-2 text-left transition-[background-color,color,box-shadow,transform] duration-200 " +
                    (isSelected
                      ? "bg-[color-mix(in_oklab,var(--palette-primary,var(--color-primary))_28%,transparent)] text-[color:var(--color-foreground)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--palette-primary,var(--color-primary))_60%,transparent),0_4px_12px_-4px_color-mix(in_oklab,var(--palette-primary,var(--color-primary))_50%,transparent)]"
                      : isActive
                        ? "bg-[color:var(--glass-bg-strong)] text-[color:var(--color-foreground)] shadow-[inset_0_1px_0_var(--glass-highlight)]"
                        : "text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--glass-bg)] hover:text-[color:var(--color-foreground)]")
                  }
                  aria-current={isActive ? "true" : undefined}
                  aria-pressed={isSelected || undefined}
                >
                  <span
                    className={
                      isActive
                        ? "text-lg font-semibold tracking-tight"
                        : "text-base"
                    }
                  >
                    {text || "♪"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {synced ? (
          <p className="px-5 pb-3 text-xs text-[color:var(--color-muted-foreground)]">
            Tap a line to seek. Tap a second line to extend a selection, then “Explain selection”.
          </p>
        ) : null}
      </div>

      <SnippetPanel
        open={panelOpen}
        excerptText={excerptText}
        state={snippetState}
        onClose={() => setPanelOpen(false)}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    </div>
  );
}

function binarySearchActive(lines: SyncedLine[], ms: number): number {
  if (lines.length === 0) return -1;
  let lo = 0;
  let hi = lines.length - 1;
  let result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].ms <= ms) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}
