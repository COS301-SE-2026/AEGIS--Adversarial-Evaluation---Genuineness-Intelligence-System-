import type { QuestionPayload } from "@/app/(admin)/types/questions";

export type NormalizedFillBlankPayload = {
  blanks: string[];
  normalizedAnswers: Record<string, string>;
};

const MCQ_OPTION_LABELS = ["A", "B", "C", "D"] as const;

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

function normalizeMcqPayload(question: QuestionPayload) {
  const options = question.options ?? [];

  if (options.length !== MCQ_OPTION_LABELS.length) {
    throw new Error("MCQ questions must have exactly four options.");
  }

  const selectedIndex = options.findIndex((option) => option.isCorrect);

  if (selectedIndex < 0 || selectedIndex >= MCQ_OPTION_LABELS.length) {
    throw new Error("Select one correct MCQ option before saving.");
  }

  return {
    correct_answer: { answer: MCQ_OPTION_LABELS[selectedIndex] },
    question_metadata: {
      options: MCQ_OPTION_LABELS.reduce((accumulator, label, index) => {
        accumulator[label] = options[index]?.text?.trim() ?? "";
        return accumulator;
      }, {} as Record<(typeof MCQ_OPTION_LABELS)[number], string>),
    },
  };
}

export function buildSourceQuestionPayload(question: QuestionPayload) {
  const basePayload = {
    title: question.title,
    content: question.content ?? "",
    type: question.type ?? "TEXT",
    maximum_score: question.maximum_score ?? 10,
    tags: question.tags ?? [],
    category_id: question.category_id,
    difficulty: question.difficulty,
  };

  switch (question.type) {
    case "CODING":
      return {
        ...basePayload,
        correct_answer: question.correct_answer ?? "",
        question_metadata: question.question_metadata ?? {},
      };

    case "MCQ":
      return {
        ...basePayload,
        ...normalizeMcqPayload(question),
      };

    case "FILL_IN_THE_BLANK": {
      const { blanks, normalizedAnswers } = normalizeFillBlankPayload(question);

      return {
        ...basePayload,
        type: "FILL_IN_THE_BLANK",
        correct_answer: { answer: normalizedAnswers },
        question_metadata: {
          blanks,
        },
      };
    }

    default:
      return {
        ...basePayload,
        correct_answer: question.correct_answer,
        question_metadata: question.question_metadata,
      };
  }
}