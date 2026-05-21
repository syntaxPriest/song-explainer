"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export type SnippetState =
  | { status: "loading" }
  | { status: "ready"; explanation: string; cached: boolean }
  | { status: "error"; message: string };

type Props = {
  open: boolean;
  excerptText: string;
  state: SnippetState | null;
  onClose: () => void;
  onRetry: () => void;
};

export function SnippetPanel({
  open,
  excerptText,
  state,
  onClose,
  onRetry,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            role="dialog"
            aria-modal="true"
            aria-label="Passage explanation"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[color:var(--glass-border-strong)] bg-[color:var(--color-background)]/85 shadow-[inset_1px_0_0_var(--glass-highlight),-30px_0_60px_-10px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
          >
            <header className="flex items-center justify-between border-b border-[color:var(--glass-border)] px-5 py-4">
              <h2 className="text-base font-semibold tracking-tight">
                What this means
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-muted-foreground)] transition-colors hover:bg-[color:var(--glass-bg-strong)] hover:text-[color:var(--color-foreground)]"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <blockquote className="border-l-2 border-[color:var(--palette-primary,var(--color-primary))] pl-4 font-serif text-base italic text-[color:var(--color-muted-foreground)]">
                {excerptText}
              </blockquote>

              <div className="mt-6">
                {state?.status === "loading" ? (
                  <div className="inline-flex items-center gap-2 text-sm text-[color:var(--color-muted-foreground)]">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Asking the model…
                  </div>
                ) : null}

                {state?.status === "error" ? (
                  <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
                    <p className="text-sm text-[color:var(--color-muted-foreground)]">
                      {state.message}
                    </p>
                    <Button size="sm" className="mt-3" onClick={onRetry}>
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      Try again
                    </Button>
                  </div>
                ) : null}

                {state?.status === "ready" ? (
                  <div className="space-y-3 whitespace-pre-wrap text-base leading-relaxed text-[color:var(--color-foreground)]">
                    {state.explanation}
                    {state.cached ? (
                      <p className="text-xs text-[color:var(--color-muted-foreground)]">
                        Served from cache.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
