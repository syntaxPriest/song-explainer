export const SITE = {
  name: "Song Explainer",
  description:
    "Paste a song. Get a lyrics breakdown — meaning, themes, references, and similar tracks.",
};

export function siteUrl(): string {
  // Vercel populates VERCEL_URL automatically; fall back to a public env var,
  // then localhost for dev.
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  return fromEnv ?? "http://localhost:3000";
}
