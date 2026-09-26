import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon (iOS/Android): same mark as the favicon at 180 px. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#08090d" }}>
        <div
          style={{
            width: 112,
            height: 112,
            borderRadius: 999,
            background: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 50, height: 50, borderRadius: 999, background: "#08090d" }} />
        </div>
      </div>
    ),
    size,
  );
}
