"use client";

import { useEffect, useRef } from "react";
import { Download, Smartphone } from "lucide-react";

export default function DownloadCTA() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ opacity: 0, transform: "translateY(24px)", transition: "all 0.7s ease" }}
      className="py-24 px-5"
    >
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-accent/10 via-bg-surface to-purple-500/10 border border-accent/20 rounded-3xl p-8 sm:p-12 md:p-16 text-center">
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/15 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative">
            <div className="inline-flex p-4 rounded-2xl bg-accent/10 border border-accent/20 mb-6">
              <Smartphone size={32} className="text-accent" />
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight mb-4">
              Ready to take control of{" "}
              <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
                your attendance?
              </span>
            </h2>

            <p className="text-text-secondary text-lg max-w-lg mx-auto mb-8">
              Download Rollcall and make attendance tracking effortless. Free,
              offline, and built for students.
            </p>

            <a
              href="/download"
              className="inline-flex items-center gap-2.5 bg-accent hover:bg-accent-soft text-white text-lg font-bold px-10 py-4 rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5"
            >
              <Download size={22} />
              Download APK
            </a>

            <p className="mt-4 text-xs text-text-muted">
              Android • Free • No sign-up required
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
