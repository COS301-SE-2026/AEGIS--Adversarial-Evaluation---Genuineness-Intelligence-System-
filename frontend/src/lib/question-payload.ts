import type { QuestionPayload } from "@/app/(admin)/types/questions";

export type NormalizedFillBlankPayload = {
  blanks: string[];
  normalizedAnswers: Record<string, string>;
};

export function normalizeFillBlankPayload(
  question: QuestionPayload,
): NormalizedFillBlankPayload {
  const blanks = question.blanks ?? [];

  if (blanks.length === 0) {
    throw new Error("Fill-in-the-blank questions must have at least one blank.");
  }

  const answerSource =
    question.correct_answer &&
    typeof question.correct_answer === "object" &&
    "answer" in question.correct_answer
      ? question.correct_answer.answer
      : null;

  if (!answerSource || typeof answerSource !== "object") {
    throw new Error("Fill-in-the-blank questions need answer values for each blank.");
  }

  const answerMap = answerSource as Record<string, unknown>;
  const normalizedAnswers = blanks.reduce((accumulator, blank) => {
    const value = answerMap[blank];

    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`Fill-in-the-blank answer for ${blank} must be a non-empty string.`);
    }

    accumulator[blank] = value.trim();
    return accumulator;
  }, {} as Record<string, string>);

  return {
    blanks,
    normalizedAnswers,
  };
}