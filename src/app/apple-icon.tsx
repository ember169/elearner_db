import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          borderRadius: "36px",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 32 32" fill="none">
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="#d7c19c"
            strokeWidth="2.5"
            strokeDasharray="8.6 1.61"
          />
          <circle
            cx="16"
            cy="16"
            r="9"
            stroke="#d7c19c"
            strokeWidth="1.5"
            opacity="0.75"
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
