"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Music, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Candidate = {
  id: string;
  name: string;
  artist: string;
  album: string;
  releaseYear: string;
  image: string | null;
};

type ResolveResponse =
  | { track: Candidate }
  | { candidates: Candidate[] }
  | { error: string };

export function SongSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);
    setCandidates(null);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as ResolveResponse;
      if (!res.ok) {
        const err =
          "error" in data ? data.error : `Resolve failed (${res.status})`;
        throw new Error(err);
      }
      if ("track" in data) {
        // URL / ISRC → unambiguous, go straight to the song page.
        router.push(`/song/${data.track.id}`);
        return;
      }
      if ("candidates" in data) {
        setCandidates(data.candidates);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function pickCandidate(id: string) {
    setNavigating(id);
    router.push(`/song/${id}`);
  }

  function closeModal() {
    if (navigating) return;
    setCandidates(null);
  }

  return (
    <motion.div
      className="w-full max-w-2xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
    >
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Music
              className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[color:var(--color-primary)]"
              aria-hidden
            />
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Spotify URL, ISRC, or 'Song — Artist'"
              className="pl-12"
              disabled={submitting}
              autoFocus
            />
          </div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              type="submit"
              size="lg"
              disabled={submitting || !value.trim()}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {submitting ? "Searching" : "Search"}
            </Button>
          </motion.div>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <CandidatesModal
        open={!!candidates && candidates.length > 0}
        candidates={candidates ?? []}
        navigating={navigating}
        onPick={pickCandidate}
        onClose={closeModal}
      />
    </motion.div>
  );
}

function CandidatesModal({
  open,
  candidates,
  navigating,
  onPick,
  onClose,
}: {
  open: boolean;
  candidates: Candidate[];
  navigating: string | null;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  // createPortal needs the DOM; gate the render until after hydration.
  useEffect(() => setMounted(true), []);

  // Esc to close, plus lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="candidates-modal"
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="candidates-title"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 -z-10 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[color:var(--glass-border)] px-5 py-4">
              <div>
                <h2
                  id="candidates-title"
                  className="text-base font-semibold tracking-tight"
                >
                  Pick the right track
                </h2>
                <p className="mt-0.5 text-xs text-[color:var(--color-muted-foreground)]">
                  Same titles, remasters, and live takes can collide — choose the version you mean.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[color:var(--color-muted-foreground)] transition-colors hover:bg-[color:var(--glass-bg-strong)] hover:text-[color:var(--color-foreground)]"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <ul className="max-h-[60vh] divide-y divide-[color:var(--glass-border)] overflow-y-auto">
              {candidates.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onPick(c.id)}
                    disabled={navigating !== null}
                    className="group flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-[color:var(--glass-bg-strong)] disabled:opacity-60"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[color:var(--color-muted)]">
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.image}
                          alt=""
                          aria-hidden
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold tracking-tight">
                        {c.name}
                      </p>
                      <p className="truncate text-xs text-[color:var(--color-muted-foreground)]">
                        {c.artist} · {c.album}
                        {c.releaseYear ? ` · ${c.releaseYear}` : ""}
                      </p>
                    </div>
                    {navigating === c.id ? (
                      <Loader2
                        className="h-4 w-4 shrink-0 animate-spin text-[color:var(--color-muted-foreground)]"
                        aria-hidden
                      />
                    ) : (
                      <span className="shrink-0 text-xs text-[color:var(--color-muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100">
                        Explain →
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
