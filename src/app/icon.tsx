import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
          background: "#1f1d19",
          borderRadius: "6px",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
          <path
            d="M14 2L4 6.5V13C4 19.5 8.2 25.4 14 27C19.8 25.4 24 19.5 24 13V6.5L14 2Z"
            fill="#c8a84e"
          />
          <path
            d="M10 12L13 14.5L10 17"
            stroke="#1a1916"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="14.5"
            y1="17"
            x2="18"
            y2="17"
            stroke="#1a1916"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
