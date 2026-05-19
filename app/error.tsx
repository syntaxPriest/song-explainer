"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle
        className="h-10 w-10 text-[color:var(--color-muted-foreground)]"
        aria-hidden
      />
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-[color:var(--color-muted-foreground)]">
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest ? (
        <p className="text-xs text-[color:var(--color-muted-foreground)]">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
