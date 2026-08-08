"use client";

import { useEffect, useRef } from "react";
import { Download, ChevronDown } from "lucide-react";

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    requestAnimationFrame(() => {
      el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-24 pb-16 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Eyebrow */}
      <div className="inline-flex items-center gap-2 bg-accent-glow border border-accent/20 rounded-full px-4 py-1.5 mb-6">
        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <span className="text-xs font-bold text-accent tracking-wide uppercase">
          Attendance, simplified
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-text-primary leading-tight max-w-5xl tracking-tight">
        Rollcall — Student Attendance Tracker &{" "}
        <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
          Attendance Calculator
        </span>
      </h1>

      {/* Description */}
      <p className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed">
        Rollcall helps students effortlessly track lectures, monitor attendance
        percentages, and know exactly how many classes they can skip — all
        offline, right from their phone.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
        <a
          href="/download"
          className="inline-flex items-center gap-2.5 bg-accent hover:bg-accent-soft text-white text-base font-bold px-8 py-4 rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5"
        >
          <Download size={20} />
          Download Rollcall
        </a>
        <a
          href="#features"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-base font-semibold px-6 py-4 rounded-2xl border border-border hover:border-border-subtle transition-all duration-200"
        >
          Explore Features
          <ChevronDown size={18} />
        </a>
      </div>

      {/* Phone Mockup */}
      <div className="relative mt-16 md:mt-20">
        <div className="relative mx-auto w-[260px] sm:w-[280px] md:w-[300px]">
          {/* Phone frame */}
          <div className="rounded-[2.5rem] border-[6px] border-zinc-700/80 bg-bg-surface shadow-2xl shadow-black/50 overflow-hidden">
            {/* Status bar */}
            <div className="h-6 bg-bg-surface flex items-center justify-center">
              <div className="w-20 h-4 bg-zinc-800 rounded-full" />
            </div>
            {/* App mockup content */}
            <div className="px-4 pb-6 pt-2 space-y-3">
              {/* Greeting */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-extrabold text-text-primary">Hi, Student 👋</div>
                  <div className="text-[8px] text-text-muted">Track your attendance!</div>
                </div>
                <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30" />
              </div>
              {/* Summary card */}
              <div className="bg-accent/10 rounded-2xl p-3 border border-accent/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-[3px] border-accent flex items-center justify-center">
                    <span className="text-[11px] font-extrabold text-accent">87%</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-text-primary">Your Attendance</div>
                    <div className="text-[8px] text-success font-semibold">Great job! 🎉</div>
                  </div>
                </div>
              </div>
              {/* Subject cards */}
              {[
                { name: "Data Structures", pct: "92%", type: "Theory", color: "bg-accent/10 border-accent/20", textColor: "text-accent" },
                { name: "Physics Lab", pct: "78%", type: "Lab", color: "bg-amber-500/10 border-amber-500/20", textColor: "text-amber-400" },
                { name: "Mathematics", pct: "85%", type: "Theory", color: "bg-emerald-500/10 border-emerald-500/20", textColor: "text-emerald-400" },
              ].map((subj) => (
                <div key={subj.name} className={`rounded-xl p-2.5 border ${subj.color}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-bold text-text-primary">{subj.name}</div>
                      <div className="text-[7px] text-text-muted">{subj.type}</div>
                    </div>
                    <span className={`text-[10px] font-extrabold ${subj.textColor}`}>{subj.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Glow under phone */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-accent/20 rounded-full blur-xl" />
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown size={24} className="text-text-muted" />
      </div>
    </section>
  );
}
