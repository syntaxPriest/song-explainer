"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";

import { AnalysisTabs, type SpotifyRec } from "@/components/analysis-tabs";
import {
  type LyricsPayload,
  type TrackContext,
} from "@/components/lyrics/lyric-lines";
import { Button } from "@/components/ui/button";
import { AnalysisSchema, type Analysis } from "@/lib/schemas";

type State =
  | { status: "loading" }
  | { status: "ready"; analysis: Analysis; cached: boolean }
  | { status: "error"; message: string };

export function AnalysisLoader({
  id,
  title,
  artist,
}: {
  id: string;
  title: string;
  artist: string;
}) {
  const trackContext: TrackContext = { spotifyId: id, title, artist };
  const [state, setState] = useState<State>({ status: "loading" });
  const [recs, setRecs] = useState<SpotifyRec[]>([]);
  const [lyrics, setLyrics] = useState<LyricsPayload | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    setRecs([]);
    setLyrics(null);
    setLyricsLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          analysis?: unknown;
          cached?: boolean;
        };
        if (!res.ok) {
          throw new Error(data.error ?? `Analyze failed (${res.status})`);
        }
        const analysis = AnalysisSchema.parse(data.analysis);
        if (!cancelled) {
          setState({
            status: "ready",
            analysis,
            cached: Boolean(data.cached),
          });
        }
      } catch (err) {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    })();

    // recommendations are best-effort and run in parallel; never block on them
    (async () => {
      try {
        const res = await fetch(`/api/recommendations?id=${id}`);
        if (!res.ok) return;
        const data = (await res.json()) as { recommendations: SpotifyRec[] };
        if (!cancelled) setRecs(data.recommendations ?? []);
      } catch {
        // ignore
      }
    })();

    // lyrics — also best-effort, runs in parallel
    (async () => {
      try {
        const res = await fetch(`/api/lyrics?id=${id}`);
        if (!res.ok) {
          if (!cancelled) setLyrics(null);
          return;
        }
        const data = (await res.json()) as LyricsPayload;
        if (!cancelled) setLyrics(data);
      } catch {
        if (!cancelled) setLyrics(null);
      } finally {
        if (!cancelled) setLyricsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  if (state.status === "loading") {
    return <AnalysisSkeleton />;
  }

  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-6">
        <h2 className="text-lg font-semibold">Couldn’t analyze this song</h2>
        <p className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
          {state.message}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={retry}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Try again
          </Button>
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Needs <code>OPENAI_API_KEY</code> and{" "}
            <code>GENIUS_ACCESS_TOKEN</code> (or <code>MUSIXMATCH_KEY</code>) in{" "}
            <code>.env.local</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {state.cached ? (
        <p className="mb-4 text-xs text-[color:var(--color-muted-foreground)]">
          Served from cache.
        </p>
      ) : null}
      <AnalysisTabs
        analysis={state.analysis}
        spotifyRecs={recs}
        lyrics={lyrics}
        lyricsLoading={lyricsLoading}
        trackContext={trackContext}
      />
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
      <div className="inline-flex items-center gap-2 rounded-md bg-[color:var(--color-muted)] px-4 py-2 text-sm text-[color:var(--color-muted-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Analyzing lyrics…
      </div>
      <div className="space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[color:var(--color-muted)]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[color:var(--color-muted)]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-[color:var(--color-muted)]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 animate-pulse rounded-lg bg-[color:var(--color-muted)]" />
        <div className="h-24 animate-pulse rounded-lg bg-[color:var(--color-muted)]" />
      </div>
    </div>
  );
}
