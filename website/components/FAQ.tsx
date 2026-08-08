"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is Rollcall?",
    answer:
      "Rollcall is a free, offline-first mobile app and student attendance tracker that helps college students log lectures, monitor subject attendance percentages, and calculate how many classes they can safely skip or need to attend to maintain eligibility.",
  },
  {
    question: "How does Rollcall track student attendance?",
    answer:
      "You add your Theory and Lab subjects with custom weekly schedules. Each day, you can mark lectures as Present, Absent, or Holiday with a single tap. Rollcall updates your real-time attendance percentages instantly.",
  },
  {
    question: "Is Rollcall an attendance calculator?",
    answer:
      "Yes. Rollcall functions as both an attendance tracker and a smart attendance percentage calculator. It continuously computes your current percentage against your minimum target (e.g. 75%) and tells you exact safe skip or recovery counts.",
  },
  {
    question: "Can students track attendance by subject?",
    answer:
      "Yes, you can track individual subjects with custom weekly schedules, target percentages, and lecture histories for both Theory and Practical Lab courses.",
  },
  {
    question: "How do I calculate my attendance percentage?",
    answer:
      "Your attendance percentage is calculated by dividing your total attended lectures by total held lectures, then multiplying by 100. Rollcall calculates this automatically for every subject and overall.",
  },
  {
    question: "How many classes can I miss?",
    answer:
      "Rollcall automatically computes your 'Safe Skips' — the maximum number of upcoming classes you can miss while keeping your percentage at or above your specified attendance target.",
  },
  {
    question: "Is Rollcall available on Android?",
    answer:
      "Yes, Rollcall is available as an Android APK that you can download directly from this website.",
  },
  {
    question: "How do I install the Rollcall APK?",
    answer:
      'Download the APK file from the /download page. On your Android device, enable "Install from unknown sources" in Settings, tap the downloaded APK, and follow the installation prompt.',
  },
  {
    question: "Is Rollcall free?",
    answer:
      "Yes, Rollcall is 100% free and open-source under the MIT License. It contains no ads, subscriptions, or paywalls.",
  },
  {
    question: "Who developed Rollcall?",
    answer:
      "Rollcall was developed by sumitc0de. You can explore the source code on GitHub or visit the developer portfolio at sumitxdev.online.",
  },
  {
    question: "Does Rollcall work offline?",
    answer:
      "Yes. Rollcall stores all data locally on your device using SQLite. It requires zero internet connection, cloud logins, or accounts to operate.",
  },
  {
    question: "How can I submit feedback or report bugs?",
    answer:
      "You can send feedback directly using the feedback form on this website or reach out via GitHub.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="py-24 px-5">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-accent tracking-widest uppercase mb-3">
            FAQ
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight">
            Frequently asked{" "}
            <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
              questions
            </span>
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-bg-surface border border-border rounded-2xl overflow-hidden transition-colors hover:border-border-subtle"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                aria-expanded={openIndex === i}
                aria-controls={`faq-answer-${i}`}
                id={`faq-question-${i}`}
              >
                <span className="text-base font-bold text-text-primary pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-text-muted transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="px-6 pb-5 text-sm text-text-secondary leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
