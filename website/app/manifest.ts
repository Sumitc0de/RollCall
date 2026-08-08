import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rollcall — Student Attendance Tracker",
    short_name: "Rollcall",
    description:
      "Simple, offline-first student attendance tracking and attendance percentage calculator.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090B",
    theme_color: "#6366F1",
    icons: [
      {
        src: "/logo/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
