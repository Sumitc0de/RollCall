/**
 * Feedback submission abstraction.
 *
 * Currently logs the feedback data to console and simulates a network delay.
 * To connect a real backend, replace the body of `submitFeedback` with an
 * API call, for example:
 *
 * ```ts
 * const res = await fetch("/api/feedback", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify(data),
 * });
 * if (!res.ok) throw new Error("Failed to submit feedback");
 * return await res.json();
 * ```
 */

export interface FeedbackData {
  name: string;
  email: string;
  rating?: number;
  feedback: string;
}

export async function submitFeedback(data: FeedbackData): Promise<{ success: boolean }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // In development, log the data
  if (process.env.NODE_ENV === "development") {
    console.log("[Feedback Submitted]", data);
  }

  // TODO: Replace with actual API call when backend is ready
  return { success: true };
}
