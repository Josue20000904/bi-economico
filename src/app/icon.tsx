import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#07111f",
          border: "4px solid #fbbf24",
          borderRadius: 16,
          color: "#fbbf24",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          fontSize: 24,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          letterSpacing: -1,
          width: "100%",
        }}
      >
        BI
      </div>
    ),
    size,
  );
}
