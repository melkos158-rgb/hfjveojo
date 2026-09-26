import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon: the brand "O" on the dark background, gradient ring in the accent colours. Rendered at build time. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08090d",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 999, background: "#08090d" }} />
        </div>
      </div>
    ),
    size,
  );
}
