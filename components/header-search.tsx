"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";

export function HeaderSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });
      if (!res.ok) throw new Error(`Resolve failed (${res.status})`);
      // The header is too cramped for a candidate picker. For free-text
      // we pick the top match; for URL/ISRC the API returns a single
      // `track`. The main search box on the homepage shows the full
      // picker for proper disambiguation.
      const data = (await res.json()) as
        | { track: { id: string } }
        | { candidates: { id: string }[] };
      const id =
        "track" in data ? data.track.id : data.candidates[0]?.id ?? null;
      if (!id) throw new Error("No match");
      setValue("");
      router.push(`/song/${id}`);
    } catch (err) {
      console.error("[header-search]", err);
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative hidden flex-1 max-w-xl sm:block"
    >
      {pending ? (
        <Loader2
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[color:var(--color-muted-foreground)]"
          aria-hidden
        />
      ) : (
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted-foreground)]"
          aria-hidden
        />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Spotify URL, ISRC, or 'Song — Artist'"
        disabled={pending}
        className="h-9 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] pl-9 pr-3 text-sm text-[color:var(--color-foreground)] placeholder:text-[color:var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] disabled:opacity-60"
      />
    </form>
  );
}
