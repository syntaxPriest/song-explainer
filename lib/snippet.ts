import { createHash } from "node:crypto";

export function hashSnippet(lines: { text: string }[]): string {
  const joined = lines.map((l) => l.text).join("\n");
  return createHash("sha256").update(joined).digest("hex").slice(0, 16);
}
