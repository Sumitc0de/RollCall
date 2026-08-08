"use client";

import { useEffect, useRef } from "react";

export default function AppPreview() {
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
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-accent tracking-widest uppercase mb-3">
            App Preview
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight">
            A glimpse of{" "}
            <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
              Rollcall
            </span>
          </h2>
          <p className="mt-4 text-text-secondary text-lg max-w-xl mx-auto">
            Clean, intuitive interface designed to make attendance tracking feel effortless.
          </p>
        </div>

        {/* Three Phone Mockups */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-6">
          {/* Phone 1 — Dashboard */}
          <PhoneMockup label="Dashboard">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-extrabold text-text-primary">Hi, Student 👋</div>
                  <div className="text-[7px] text-text-muted">Your attendance overview</div>
                </div>
                <div className="w-6 h-6 rounded-full bg-accent/20" />
              </div>
              <div className="bg-accent/10 rounded-xl p-3 border border-accent/15">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full border-[3px] border-accent border-l-accent/20 flex items-center justify-center">
                    <span className="text-xs font-extrabold text-accent">87%</span>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-text-primary">Overall Attendance</div>
                    <div className="text-[7px] text-success font-semibold">Great job! 🎉</div>
                    <div className="text-[7px] text-text-muted">Keep it above 75%</div>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/15">
                <div className="text-[7px] text-emerald-400 font-bold">✓ You can miss 4 more lectures</div>
              </div>
              {["Data Structures", "Mathematics II"].map((s, i) => (
                <div key={s} className={`rounded-lg p-2 border ${i === 0 ? "border-accent/15 bg-accent/5" : "border-emerald-500/15 bg-emerald-500/5"}`}>
                  <div className="flex justify-between items-center">
                    <div className="text-[8px] font-bold text-text-primary">{s}</div>
                    <span className={`text-[8px] font-extrabold ${i === 0 ? "text-accent" : "text-emerald-400"}`}>{i === 0 ? "92%" : "85%"}</span>
                  </div>
                </div>
              ))}
            </div>
          </PhoneMockup>

          {/* Phone 2 — Mark Attendance */}
          <PhoneMockup label="Mark Attendance" featured>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-[10px] font-extrabold text-text-primary">Mark Attendance</div>
              </div>
              <div className="flex justify-around bg-bg-elevated rounded-lg p-2">
                {[
                  { n: "42", l: "Present", c: "text-emerald-400" },
                  { n: "6", l: "Absent", c: "text-red-400" },
                  { n: "2", l: "Holiday", c: "text-accent" },
                ].map((s) => (
                  <div key={s.l} className="text-center">
                    <div className={`text-[11px] font-extrabold ${s.c}`}>{s.n}</div>
                    <div className="text-[6px] text-text-muted">{s.l}</div>
                  </div>
                ))}
              </div>
              {["Monday, 04 Aug", "Tuesday, 05 Aug"].map((date, di) => (
                <div key={date} className="space-y-1.5">
                  <div className="text-[7px] font-bold text-text-muted">{date}</div>
                  <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                    <div className="text-[8px] font-bold text-text-primary mb-1.5">
                      {di === 0 ? "Data Structures" : "Physics Lab"}
                    </div>
                    <div className="flex gap-1">
                      {["Present", "Absent", "Holiday"].map((st, si) => (
                        <div key={st} className={`flex-1 text-center py-1 rounded text-[6px] font-bold ${
                          si === 0 ? "bg-emerald-500/20 text-emerald-400" :
                          si === 1 ? "bg-red-500/10 text-red-400" :
                          "bg-zinc-700/50 text-text-muted"
                        }`}>
                          {st}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PhoneMockup>

          {/* Phone 3 — Subject Detail */}
          <PhoneMockup label="Subject Detail">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-accent/15 flex items-center justify-center">
                  <span className="text-[8px] text-accent">📚</span>
                </div>
                <div>
                  <div className="text-[9px] font-extrabold text-text-primary">Data Structures</div>
                  <div className="text-[6px] text-text-muted">Theory • 32 Lectures</div>
                </div>
                <div className="ml-auto bg-purple-500/15 rounded-full px-2 py-0.5">
                  <span className="text-[6px] font-bold text-purple-400">TARGET 75%</span>
                </div>
              </div>
              <div className="flex items-center justify-around py-2">
                <div className="w-16 h-16 rounded-full border-[3px] border-purple-400 border-l-purple-400/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-[11px] font-extrabold text-text-primary">92.0%</div>
                    <div className="text-[6px] text-text-muted">Current</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[
                    { dot: "bg-emerald-400", val: "29", label: "Present" },
                    { dot: "bg-red-400", val: "3", label: "Absent" },
                    { dot: "bg-zinc-400", val: "32", label: "Total" },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                      <span className="text-[8px] font-bold text-text-primary w-3">{r.val}</span>
                      <span className="text-[7px] text-text-muted">{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/15">
                <div className="text-[7px] text-emerald-400 font-bold">
                  ✓ Safe to skip 5 more classes
                </div>
              </div>
            </div>
          </PhoneMockup>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup({
  children,
  label,
  featured,
}: {
  children: React.ReactNode;
  label: string;
  featured?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center ${featured ? "md:-mt-4 md:scale-105" : ""}`}>
      <div
        className={`relative w-[220px] rounded-[2rem] border-[5px] shadow-2xl overflow-hidden ${
          featured
            ? "border-accent/40 shadow-accent/10"
            : "border-zinc-700/60 shadow-black/40"
        }`}
      >
        {/* Screen */}
        <div className="bg-bg-surface">
          {/* Notch */}
          <div className="h-5 flex items-center justify-center">
            <div className="w-16 h-3.5 bg-zinc-800 rounded-full" />
          </div>
          {/* Content */}
          <div className="px-3 pb-4 pt-1 min-h-[280px]">{children}</div>
          {/* Bottom bar */}
          <div className="h-4 flex items-center justify-center">
            <div className="w-24 h-1 bg-zinc-700 rounded-full" />
          </div>
        </div>
      </div>
      <span className="mt-3 text-xs font-semibold text-text-muted">{label}</span>
    </div>
  );
}
