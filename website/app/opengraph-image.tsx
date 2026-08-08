import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Rollcall — Student Attendance Tracker & Calculator";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #09090B 0%, #18181B 50%, #120E2E 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Glow circle */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "500px",
            height: "500px",
            background: "rgba(99, 102, 241, 0.15)",
            borderRadius: "50%",
            filter: "blur(80px)",
          }}
        />

        {/* Brand Tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "9999px",
            padding: "8px 24px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#6366F1",
            }}
          />
          <span
            style={{
              color: "#818CF8",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Student Attendance App
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#FAFAFA",
            textAlign: "center",
            lineHeight: 1.15,
            marginBottom: "20px",
            maxWidth: "950px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          Track Attendance. Never Miss Your Target.
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: "#A1A1AA",
            textAlign: "center",
            maxWidth: "750px",
            lineHeight: 1.5,
            marginBottom: "40px",
          }}
        >
          Simple attendance tracker & percentage calculator for college students. Free & offline.
        </div>

        {/* Footer info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            color: "#71717A",
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          <span>Android App</span>
          <span>•</span>
          <span>Offline SQLite</span>
          <span>•</span>
          <span>Developed by sumitc0de</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
