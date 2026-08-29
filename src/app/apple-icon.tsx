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
          <circle cx="16" cy="16" r="15" fill="#d7c19c" />
          <circle
            cx="16"
            cy="16"
            r="12.6"
            stroke="#131211"
            strokeWidth="1.1"
            opacity="0.28"
          />
          <path
            d="M12 9.5L20.5 16L12 22.5"
            stroke="#131211"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
