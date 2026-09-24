"use client";

import { useMemo } from "react";
import { Question } from "./question.type";

type FillInTheBlanksProps = {
  question: Question;
  value?: string;
  onChange?: (value: string) => void;
};

function parseStoredAnswers(value?: string): Record<string, string> {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && "answer" in parsed) {
      const answerObject = (parsed as { answer?: unknown }).answer;
      if (answerObject && typeof answerObject === "object") {
        return Object.entries(answerObject as Record<string, unknown>).reduce(
          (accumulator, [label, answer]) => {
            accumulator[label] = typeof answer === "string" ? answer : "";
            return accumulator;
          },
          {} as Record<string, string>,
        );
      }
    }
  } catch {
    return {};
  }

  return {};
}

export function TestFillInTheBlanksCard({
  question,
  value,
  onChange,
}: FillInTheBlanksProps) {
  const blankLabels = useMemo(() => question.options, [question.options]);
  const answers = useMemo(() => parseStoredAnswers(value), [value]);

  const updateAnswer = (label: string, nextValue: string) => {
    const nextAnswers = {
      ...answers,
      [label]: nextValue,
    };
    onChange?.(JSON.stringify({ answer: nextAnswers }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mt-4 pt-4 mb-6 pb-4 border-b border-default-border/75">
        <p className="text-sm text-default-text/80 mt-1.5">
            Enter the appropriate response for each labeled blank below.
        </p>
      </div>

      <div className="flex flex-col">
        {blankLabels.length === 0 ? (
          <div className="rounded-md border border-default-border/70 bg-background p-4 text-sm text-status-warning">
            No blank labels were found for this question.
          </div>
        ) : (
            <div className="space-y-5">
                {blankLabels.map((label) => (
                    <div
                        key={label}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
                    >
                    <label className="shrink-0 text-md font-medium text-default-text tracking-wide">
                        {label}.
                    </label>

                    <input
                        type="text"
                        value={answers[label] ?? ""}
                        onChange={(event) => updateAnswer(label, event.target.value)}
                        placeholder="Type your answer for here..."
                        className="flex-1 rounded-md border border-default-border/40 bg-secondary-surface px-4 py-4 text-sm text-default-text focus:border-status-info focus:ring-1 focus:ring-status-info/20 focus:outline-none transition-colors"
                    />
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
