export type Palette = {
  /** Most dominant color, suitable for primary accents */
  primary: string;
  /** Second-most dominant color, used for secondary gradient stop */
  secondary: string;
  /** Highest-contrast color against the primary, suitable for highlights */
  accent: string;
};

const SAMPLE_SIZE = 64;
const K = 5;
const MAX_ITERATIONS = 12;

type RGB = [number, number, number];

export async function extractPalette(imageUrl: string): Promise<Palette> {
  const pixels = await sampleImagePixels(imageUrl);
  if (pixels.length === 0) {
    return fallbackPalette();
  }
  const clusters = kmeans(pixels, K);
  // sort clusters by population, descending
  clusters.sort((a, b) => b.count - a.count);
  const primary = clusters[0]?.center ?? [120, 60, 200];
  const secondary = clusters[1]?.center ?? primary;
  const accent = pickHighestContrast(primary, clusters.map((c) => c.center));
  return {
    primary: rgbToHex(primary),
    secondary: rgbToHex(secondary),
    accent: rgbToHex(accent),
  };
}

function fallbackPalette(): Palette {
  return { primary: "#7c3aed", secondary: "#db2777", accent: "#f5d0fe" };
}

async function sampleImagePixels(url: string): Promise<RGB[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => reject(new Error("Image failed to load"));
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve([]);
          return;
        }
        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
        const pixels: RGB[] = [];
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 200) continue;
          // skip near-black and near-white pixels — they wash out gradients
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max < 25 || min > 235) continue;
          pixels.push([r, g, b]);
        }
        resolve(pixels);
      } catch (err) {
        reject(err);
      }
    };
    img.src = url;
  });
}

function kmeans(pixels: RGB[], k: number): { center: RGB; count: number }[] {
  // initialize centers by taking k evenly-spaced samples
  const step = Math.max(1, Math.floor(pixels.length / k));
  const centers: RGB[] = Array.from({ length: k }, (_, i) =>
    [...pixels[Math.min(i * step, pixels.length - 1)]] as RGB,
  );

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const sums: [number, number, number, number][] = Array.from(
      { length: k },
      () => [0, 0, 0, 0],
    );
    for (const p of pixels) {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < k; i++) {
        const d = sqDist(p, centers[i]);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      sums[best][0] += p[0];
      sums[best][1] += p[1];
      sums[best][2] += p[2];
      sums[best][3] += 1;
    }
    let moved = false;
    for (let i = 0; i < k; i++) {
      const count = sums[i][3];
      if (count === 0) continue;
      const next: RGB = [
        Math.round(sums[i][0] / count),
        Math.round(sums[i][1] / count),
        Math.round(sums[i][2] / count),
      ];
      if (sqDist(next, centers[i]) > 1) moved = true;
      centers[i] = next;
    }
    if (!moved) break;
  }

  // recount populations against final centers
  const counts = new Array(k).fill(0);
  for (const p of pixels) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < k; i++) {
      const d = sqDist(p, centers[i]);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    counts[best]++;
  }

  return centers
    .map((center, i) => ({ center, count: counts[i] }))
    .filter((c) => c.count > 0);
}

function sqDist(a: RGB, b: RGB): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function pickHighestContrast(target: RGB, candidates: RGB[]): RGB {
  let best = candidates[0] ?? target;
  let bestScore = 0;
  for (const c of candidates) {
    const score = Math.abs(luminance(c) - luminance(target));
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function luminance([r, g, b]: RGB): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function rgbToHex([r, g, b]: RGB): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  );
}
