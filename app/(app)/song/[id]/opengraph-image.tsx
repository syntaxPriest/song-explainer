import { ImageResponse } from "next/og";

import { getTrack } from "@/lib/spotify";

export const runtime = "nodejs";
export const alt = "Song Explainer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let track;
  try {
    track = await getTrack(id);
  } catch {
    return new ImageResponse(<Fallback title="Song Explainer" />, size);
  }

  const artist = track.artists.map((a) => a.name).join(", ");
  const image = track.album.images[0]?.url;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #1e1b3a 0%, #3a0e4a 60%, #5b1d6e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {image ? (
          <img
            src={image}
            alt=""
            width={500}
            height={500}
            style={{
              margin: 65,
              borderRadius: 24,
              boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
            }}
          />
        ) : null}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 65px 0 0",
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            Song Explainer
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              marginTop: 20,
            }}
          >
            {track.name}
          </div>
          <div
            style={{
              fontSize: 36,
              marginTop: 20,
              opacity: 0.9,
            }}
          >
            {artist}
          </div>
        </div>
      </div>
    ),
    size,
  );
}

function Fallback({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #1e1b3a 0%, #5b1d6e 100%)",
        color: "white",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 80,
        fontFamily: "sans-serif",
      }}
    >
      {title}
    </div>
  );
}
