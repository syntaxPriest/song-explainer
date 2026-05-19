"use client";

import Link from "next/link";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Library } from "lucide-react";

export function HeaderAuth() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div className="h-8 w-16 animate-pulse rounded bg-[color:var(--color-muted)]" />;
  }

  if (isSignedIn) {
    return (
      <>
        <Link
          href="/saved"
          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted-foreground)] transition-colors hover:text-[color:var(--color-foreground)]"
        >
          <Library className="h-4 w-4" aria-hidden />
          Saved
        </Link>
        <UserButton />
      </>
    );
  }

  return (
    <SignInButton mode="modal">
      <button className="text-sm text-[color:var(--color-muted-foreground)] transition-colors hover:text-[color:var(--color-foreground)]">
        Sign in
      </button>
    </SignInButton>
  );
}
