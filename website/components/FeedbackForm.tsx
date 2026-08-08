"use client";

import { useState, type FormEvent } from "react";
import { Star, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { submitFeedback, type FeedbackData } from "@/lib/feedback";

type FormState = "idle" | "loading" | "success" | "error";

export default function FeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Please enter a valid email";
    }
    if (!feedback.trim()) e.feedback = "Feedback is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setState("loading");
    setErrorMsg("");

    const data: FeedbackData = {
      name: name.trim(),
      email: email.trim(),
      rating: rating || undefined,
      feedback: feedback.trim(),
    };

    try {
      await submitFeedback(data);
      setState("success");
      setName("");
      setEmail("");
      setRating(0);
      setFeedback("");
      setErrors({});
    } catch {
      setState("error");
      setErrorMsg("Something went wrong. Please try again later.");
    }
  };

  if (state === "success") {
    return (
      <section id="feedback" className="py-24 px-5">
        <div className="mx-auto max-w-xl">
          <div className="bg-bg-surface border border-border rounded-3xl p-12 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-success/10 border border-success/20 mb-6">
              <CheckCircle size={32} className="text-success" />
            </div>
            <h3 className="text-2xl font-extrabold text-text-primary mb-3">
              Thank you for your feedback!
            </h3>
            <p className="text-text-secondary">
              We appreciate you taking the time to share your thoughts about Rollcall.
            </p>
            <button
              onClick={() => setState("idle")}
              className="mt-6 text-sm font-bold text-accent hover:text-accent-soft transition-colors"
            >
              Send more feedback
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="feedback" className="py-24 px-5">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold text-accent tracking-widest uppercase mb-3">
            Feedback
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
            We&apos;d love to{" "}
            <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
              hear from you
            </span>
          </h2>
          <p className="mt-3 text-text-secondary">
            Help us improve Rollcall by sharing your experience.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-bg-surface border border-border rounded-3xl p-6 sm:p-8 space-y-5"
        >
          {/* Name */}
          <div>
            <label htmlFor="feedback-name" className="block text-sm font-bold text-text-primary mb-1.5">
              Name <span className="text-danger">*</span>
            </label>
            <input
              id="feedback-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: "" }); }}
              placeholder="Your name"
              className={`w-full bg-bg-elevated border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent ${
                errors.name ? "border-danger" : "border-border"
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="feedback-email" className="block text-sm font-bold text-text-primary mb-1.5">
              Email <span className="text-danger">*</span>
            </label>
            <input
              id="feedback-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }}
              placeholder="your@email.com"
              className={`w-full bg-bg-elevated border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent ${
                errors.email ? "border-danger" : "border-border"
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2">
              Rating <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  role="radio"
                  aria-checked={rating === star}
                >
                  <Star
                    size={28}
                    className={`transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label htmlFor="feedback-message" className="block text-sm font-bold text-text-primary mb-1.5">
              Feedback <span className="text-danger">*</span>
            </label>
            <textarea
              id="feedback-message"
              value={feedback}
              onChange={(e) => { setFeedback(e.target.value); if (errors.feedback) setErrors({ ...errors, feedback: "" }); }}
              placeholder="Tell us what you think about Rollcall..."
              rows={4}
              className={`w-full bg-bg-elevated border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent resize-none ${
                errors.feedback ? "border-danger" : "border-border"
              }`}
            />
            {errors.feedback && <p className="mt-1 text-xs text-danger">{errors.feedback}</p>}
          </div>

          {/* Error message */}
          {state === "error" && (
            <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-danger shrink-0" />
              <p className="text-sm text-danger">{errorMsg}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={state === "loading"}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-soft disabled:opacity-60 disabled:cursor-not-allowed text-white text-base font-bold px-6 py-3.5 rounded-xl transition-all duration-200"
          >
            {state === "loading" ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Feedback
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
