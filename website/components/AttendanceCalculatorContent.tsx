import { Calculator, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

export default function AttendanceCalculatorContent() {
  return (
    <section id="calculator-guide" className="py-24 px-5 bg-bg-surface/50 border-y border-border">
      <div className="mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-accent tracking-widest uppercase mb-3">
            Attendance Guide
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight">
            How to calculate your{" "}
            <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
              attendance percentage
            </span>
          </h2>
          <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto">
            Understanding the math behind attendance requirements helps you stay on track and avoid exam eligibility surprises.
          </p>
        </div>

        {/* Grid layout */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Formula Card 1 */}
          <div className="bg-bg-surface border border-border rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex p-3 rounded-xl bg-accent/10 border border-accent/20 mb-5 text-accent">
                <Calculator size={24} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">
                Standard Attendance Percentage Formula
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                Your overall or subject-wise attendance percentage is calculated by dividing total attended lectures by total conducted lectures.
              </p>

              {/* Math Display Box */}
              <div className="bg-bg-elevated border border-border rounded-2xl p-5 text-center my-4 font-mono">
                <div className="text-xs text-text-muted mb-2 font-sans font-semibold">FORMULA</div>
                <div className="text-accent font-extrabold text-base sm:text-lg">
                  Percentage = ( Attended ÷ Total ) × 100
                </div>
              </div>

              <p className="text-xs text-text-muted leading-relaxed mt-4">
                Example: If you attended 27 out of 30 lectures, your attendance is (27 / 30) × 100 = <strong className="text-text-primary">90.0%</strong>.
              </p>
            </div>
          </div>

          {/* Formula Card 2 — Safe Skips & Recovery */}
          <div className="bg-bg-surface border border-border rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-5 text-purple-400">
                <Lightbulb size={24} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">
                Smart Safe Skips & Recovery Math
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                Rollcall automates complex calculations to answer the two most common student questions:
              </p>

              <div className="space-y-4">
                {/* Safe Skips */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                    <CheckCircle2 size={16} />
                    How many classes can I miss?
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Calculates how many future classes you can safely skip while keeping your percentage at or above your target (e.g. 75%).
                  </p>
                </div>

                {/* Recovery Needed */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                    <AlertTriangle size={16} />
                    How many classes do I need to attend?
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    If your attendance falls below target, Rollcall calculates the exact number of consecutive classes required to recover.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
