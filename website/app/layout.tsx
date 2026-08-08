import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-nunito",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : new URL("https://rollcall.app");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Rollcall — Student Attendance Tracker & Attendance Calculator",
  description:
    "Rollcall is a free offline-first student attendance tracker and attendance percentage calculator. Track lectures, calculate safe skips, and stay on top of college classes.",
  icons: {
    icon: "/logo/icon.png",
    shortcut: "/logo/icon.png",
    apple: "/logo/icon.png",
  },
  keywords: [
    "Rollcall",
    "Rollcall app",
    "attendance tracker",
    "attendance tracker app",
    "student attendance app",
    "attendance calculator",
    "college attendance tracker",
    "attendance percentage calculator",
    "class attendance tracker",
    "student attendance calculator",
    "lecture attendance tracker",
    "calculate attendance percentage",
    "how to calculate attendance percentage",
    "how many classes can I miss",
    "how many classes do I need to attend",
    "Android attendance tracker",
  ],
  authors: [{ name: "sumitc0de", url: "https://sumitxdev.online" }],
  creator: "sumitc0de",
  publisher: "sumitc0de",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "Rollcall — Student Attendance Tracker & Attendance Calculator",
    description:
      "Track lectures, calculate attendance percentage, and know how many classes you can skip. Free offline Android app for students.",
    type: "website",
    siteName: "Rollcall",
    locale: "en_US",
    url: "./",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rollcall — Student Attendance Tracker & Attendance Calculator",
    description:
      "Track lectures, calculate attendance percentage, and know how many classes you can skip.",
    creator: "@sumitc0de",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "p0K0c4tPfxdE1WExZ54l6Q8pabblz8R5GDmdePkDm0U",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
