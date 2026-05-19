import Link from "next/link";
import { Music } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function SongNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <Music
        className="h-10 w-10 text-[color:var(--color-muted-foreground)]"
        aria-hidden
      />
      <h1 className="text-2xl font-semibold">Song not found</h1>
      <p className="text-sm text-[color:var(--color-muted-foreground)]">
        That Spotify ID didn’t resolve to a track.
      </p>
      <Button asChild>
        <Link href="/">Try another song</Link>
      </Button>
    </main>
  );
}
