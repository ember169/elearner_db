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
          background: "#131211",
          borderRadius: "6px",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="#d7c19c"
            strokeWidth="2.5"
          />
          <circle cx="16" cy="16" r="5.75" fill="#d7c19c" />
          <path
            d="M13.35 13.4L15.95 16L13.35 18.6"
            stroke="#131211"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="17.15"
            y1="18.6"
            x2="18.65"
            y2="18.6"
            stroke="#131211"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
