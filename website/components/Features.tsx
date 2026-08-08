"use client";

import { useEffect, useRef } from "react";
import {
  ClipboardCheck,
  Percent,
  Calculator,
  BookOpen,
  BarChart3,
  WifiOff,
} from "lucide-react";

const features = [
  {
    icon: ClipboardCheck,
    title: "Attendance Tracking",
    description:
      "Mark lectures as Present, Absent, or Holiday with a single tap. Review and update past records anytime.",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: Percent,
    title: "Live Percentage",
    description:
      "See your real-time attendance percentage for each subject and overall — always accurate, always updated.",
    gradient: "from-accent/20 to-accent/5",
    iconColor: "text-accent",
  },
  {
    icon: Calculator,
    title: "Smart Calculations",
    description:
      "Know exactly how many classes you can safely skip or need to attend to reach your attendance target.",
    gradient: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
  },
  {
    icon: BookOpen,
    title: "Subject Management",
    description:
      "Add Theory and Lab subjects with custom weekly schedules and individual attendance targets.",
    gradient: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
  },
  {
    icon: BarChart3,
    title: "Attendance Insights",
    description:
      "Get smart, tone-based alerts when your attendance drops below target — so you never get caught off guard.",
    gradient: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    icon: WifiOff,
    title: "Offline-First",
    description:
      "All data is stored locally on your device using SQLite. No internet required — works anywhere, anytime.",
    gradient: "from-rose-500/20 to-rose-500/5",
    iconColor: "text-rose-400",
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll("[data-feature-card]");
            cards.forEach((card, i) => {
              setTimeout(() => {
                (card as HTMLElement).style.opacity = "1";
                (card as HTMLElement).style.transform = "translateY(0)";
              }, i * 100);
            });
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
    <section id="features" ref={sectionRef} className="py-24 px-5">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-accent tracking-widest uppercase mb-3">
            Features
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
              stay on track
            </span>
          </h2>
          <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto">
            Rollcall is packed with tools designed specifically for students to
            manage attendance effortlessly.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              data-feature-card
              style={{ opacity: 0, transform: "translateY(24px)", transition: "all 0.5s ease" }}
              className="group relative bg-bg-surface border border-border rounded-2xl p-6 hover:border-border-subtle transition-all duration-300 hover:-translate-y-1"
            >
              {/* Gradient bg on hover */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
              <div className="relative">
                <div className={`inline-flex p-3 rounded-xl bg-bg-elevated mb-4 ${feature.iconColor}`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
