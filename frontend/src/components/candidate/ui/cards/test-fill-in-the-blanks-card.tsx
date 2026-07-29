'use client';

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
                    {} as Record<string, string>
                );
            }
        }
    } catch {
        return {};
    }

    return {};
}

export function TestFillInTheBlanksCard({ question, value, onChange }: FillInTheBlanksProps) {
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
            <div>
                <h3 className="text-base tracking-widest uppercase mt-4 mb-6">Fill in the blanks</h3>
            </div>

            <div className="flex flex-col gap-4">
                {blankLabels.length === 0 ? (
                    <div className="rounded-md border border-default-border/70 bg-background p-4 text-sm text-default-border">
                        No blank labels were found for this question.
                    </div>
                ) : blankLabels.map((label) => (
                    <div
                        key={label}
                        className="flex items-center gap-4 rounded-md border border-default-border bg-background p-4"
                    >
                        <span className="flex h-10 min-w-10 items-center justify-center rounded border border-system-white/40 bg-system-white/10 px-3 text-system-white font-staatliches text-sm">
                            [{label}]
                        </span>

                        <input
                            type="text"
                            value={answers[label] ?? ""}
                            onChange={(event) => updateAnswer(label, event.target.value)}
                            placeholder={`Answer for [${label}]`}
                            className="flex-1 rounded border border-default-border bg-secondary-surface px-4 py-2 text-sm text-default-text focus:border-system-red focus:outline-none"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}