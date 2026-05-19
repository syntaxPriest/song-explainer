"use client";

import { useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  trackKey: string;
  spotifyId: string;
  trackName: string;
  artist: string;
  imageUrl: string | null;
};

export function SaveButton(props: Props) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div
        className="h-9 w-24 animate-pulse rounded-md bg-[color:var(--color-muted)]"
        aria-hidden
      />
    );
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="outline" size="sm">
          <Bookmark className="h-4 w-4" aria-hidden />
          Sign in to save
        </Button>
      </SignInButton>
    );
  }

  return <SaveButtonInner {...props} />;
}

function SaveButtonInner({
  trackKey,
  spotifyId,
  trackName,
  artist,
  imageUrl,
}: Props) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/saved");
        if (!res.ok) {
          if (!cancelled) setSaved(false);
          return;
        }
        const data = (await res.json()) as { items: { trackKey: string }[] };
        if (!cancelled) {
          setSaved(data.items.some((i) => i.trackKey === trackKey));
        }
      } catch {
        if (!cancelled) setSaved(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trackKey]);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const next = !saved;
    setSaved(next); // optimistic
    try {
      if (next) {
        const res = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackKey,
            spotifyId,
            trackName,
            artist,
            imageUrl,
          }),
        });
        if (!res.ok) throw new Error(`Save failed (${res.status})`);
      } else {
        const res = await fetch(
          `/api/saved?trackKey=${encodeURIComponent(trackKey)}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error(`Unsave failed (${res.status})`);
      }
    } catch {
      setSaved(!next); // revert
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={pending || saved === null}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : saved ? (
        <BookmarkCheck className="h-4 w-4" aria-hidden />
      ) : (
        <Bookmark className="h-4 w-4" aria-hidden />
      )}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
