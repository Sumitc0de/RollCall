"use client";

import { useEffect, useRef } from "react";
import { Shield, Zap, Smartphone, GraduationCap } from "lucide-react";

const reasons = [
  {
    icon: Smartphone,
    title: "Built for Students",
    description: "Designed specifically for college and university students who need to stay above attendance requirements.",
  },
  {
    icon: Zap,
    title: "Instant & Lightweight",
    description: "No sign-ups, no cloud sync delays. Open the app and start tracking immediately with zero friction.",
  },
  {
    icon: Shield,
    title: "Your Data, Your Device",
    description: "All attendance data is stored locally on your phone. No servers, no privacy concerns.",
  },
  {
    icon: GraduationCap,
    title: "Smart Target System",
    description: "Set individual attendance targets per subject and let Rollcall calculate safe skips and recovery plans.",
  },
];

export default function WhyRollcall() {
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
      <div className="mx-auto max-w-6xl">
        <div className="bg-bg-surface border border-border rounded-3xl p-8 sm:p-12 md:p-16">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold text-accent tracking-widest uppercase mb-3">
              Why Rollcall
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
              The attendance app students{" "}
              <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
                actually need
              </span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {reasons.map((reason) => (
              <div key={reason.title} className="flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <reason.icon size={22} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary mb-1">
                    {reason.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
