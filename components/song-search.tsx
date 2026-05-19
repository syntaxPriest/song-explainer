"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ResolveResponse = {
  id: string;
  name: string;
  artist: string;
};

export function SongSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `Resolve failed (${res.status})`);
      }
      const data = (await res.json()) as ResolveResponse;
      router.push(`/song/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      className="w-full max-w-2xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--color-muted-foreground)]"
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
            {submitting ? "Resolving" : "Explain"}
          </Button>
        </motion.div>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </motion.form>
  );
}
