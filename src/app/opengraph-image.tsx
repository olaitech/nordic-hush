import { ImageResponse } from "next/og";
export const alt =
  "Nordic Hush. Find your quiet. Sounds for sleep, focus and calm.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#080d14",
        color: "#eef3f2",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 25,
          color: "#8eb7a6",
          marginBottom: 45,
          letterSpacing: 8,
        }}
      >
        NORDIC HUSH
      </div>
      <div style={{ fontSize: 90, fontWeight: 400 }}>Find your quiet.</div>
      <div style={{ fontSize: 28, marginTop: 30, color: "#94a3a8" }}>
        Sounds for sleep, focus and calm.
      </div>
    </div>,
    size,
  );
}
