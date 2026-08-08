"use client";

import { useEffect, useRef } from "react";
import { Plus, CheckCircle, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Plus,
    title: "Add Your Subjects",
    description:
      "Set up your Theory and Lab subjects with weekly schedules and target attendance percentages.",
    accent: "from-blue-500 to-cyan-400",
  },
  {
    number: "02",
    icon: CheckCircle,
    title: "Mark Attendance",
    description:
      "Record each lecture as Present, Absent, or Holiday. Use auto-mark to save time on regular days.",
    accent: "from-accent to-purple-400",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Stay On Track",
    description:
      "View your percentages, check how many classes you can skip, and get alerts when attendance drops.",
    accent: "from-emerald-500 to-green-400",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll("[data-step]");
            items.forEach((item, i) => {
              setTimeout(() => {
                (item as HTMLElement).style.opacity = "1";
                (item as HTMLElement).style.transform = "translateY(0)";
              }, i * 150);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24 px-5">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-accent tracking-widest uppercase mb-3">
            How It Works
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight">
            Three steps to{" "}
            <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
              attendance clarity
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-border via-accent/30 to-border" />

          {steps.map((step) => (
            <div
              key={step.number}
              data-step
              style={{ opacity: 0, transform: "translateY(24px)", transition: "all 0.6s ease" }}
              className="relative text-center"
            >
              {/* Number circle */}
              <div className="relative mx-auto mb-6 w-32 h-32 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.accent} opacity-10`} />
                <div className="absolute inset-2 rounded-full bg-bg-primary" />
                <div className="relative flex flex-col items-center">
                  <step.icon size={28} className="text-accent mb-1" />
                  <span className="text-2xl font-extrabold bg-gradient-to-br from-text-primary to-text-secondary bg-clip-text text-transparent">
                    {step.number}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-text-primary mb-3">
                {step.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
