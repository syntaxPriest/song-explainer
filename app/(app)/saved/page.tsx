import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Bookmark } from "lucide-react";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const { userId } = await auth();
  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Sign in to see your library</h1>
      </main>
    );
  }

  if (!prisma) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Library unavailable</h1>
        <p className="mt-3 text-sm text-[color:var(--color-muted-foreground)]">
          <code>DATABASE_URL</code> is not configured. Saved analyses need
          Postgres.
        </p>
      </main>
    );
  }

  const items = await prisma.savedAnalysis.findMany({
    where: { userId },
    orderBy: { savedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="font-serif text-4xl">Saved</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          {items.length} {items.length === 1 ? "song" : "songs"}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-lg border border-dashed border-[color:var(--color-border)] p-12 text-center">
          <Bookmark
            className="h-8 w-8 text-[color:var(--color-muted-foreground)]"
            aria-hidden
          />
          <p className="text-[color:var(--color-muted-foreground)]">
            Save a song from any analysis page to see it here.
          </p>
          <Link
            href="/"
            className="text-sm text-[color:var(--palette-primary,var(--color-primary))] underline-offset-4 hover:underline"
          >
            Explain a song
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/song/${item.spotifyId}`}
                className="group block overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] transition-colors hover:border-[color:var(--color-primary)]"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    width={400}
                    height={400}
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="aspect-square w-full bg-[color:var(--color-muted)]" />
                )}
                <div className="p-4">
                  <p className="truncate text-base font-medium">
                    {item.trackName}
                  </p>
                  <p className="truncate text-sm text-[color:var(--color-muted-foreground)]">
                    {item.artist}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
