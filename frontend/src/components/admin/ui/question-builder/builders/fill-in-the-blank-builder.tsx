"use client";

import { useEffect, useMemo, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { QuestionBuilderState } from "@/app/(admin)/types/question-builder";

// Matches a well-formed marker like "[A]"
const MARKER_TOKEN_REGEX = /\[[^\]]*\]|\[|\]/g;
const VALID_MARKER_REGEX = /^\[[A-Z]\]$/;

interface TemplateAnalysis {
    validLetters: string[]; // unique, in order of first appearance
    malformedTokens: string[];
    duplicates: string[];
}

function analyzeTemplate(content: string): TemplateAnalysis {
    const tokens = content.match(MARKER_TOKEN_REGEX) ?? [];
    const validLetters: string[] = [];
    const malformedTokens: string[] = [];
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const token of tokens) {
        if (VALID_MARKER_REGEX.test(token)) {
            const letter = token.slice(1, -1);
            if (seen.has(letter)) {
                duplicates.add(letter);
            } else {
                seen.add(letter);
                validLetters.push(letter);
            }
        } else {
            malformedTokens.push(token);
        }
    }
    return { validLetters, malformedTokens, duplicates: Array.from(duplicates) };
}

type FillBlanksBuilderProps = Readonly<{
    question: QuestionBuilderState;
    update<K extends keyof QuestionBuilderState>(
        key: K,
        value: QuestionBuilderState[K]
    ): void;
}>;

export default function FillBlanksBuilder({ question, update }: FillBlanksBuilderProps) {
    const updateBlank = (id: string, value: string) => {
        update(
            "blanks",
            question.blanks.map((blank) =>
                blank.id === id ? { ...blank, answer: value } : blank
            )
        );
    };

        const textareaRef = useRef<HTMLTextAreaElement | null>(null);
        const analysis = useMemo(() => analyzeTemplate(question.content), [question.content]);
const detectedKey = analysis.validLetters.join(",");


useEffect(() => {
    const nextBlanks = analysis.validLetters.map((letter) => {
        const existing = question.blanks.find((blank) => blank.id === letter);
        return { id: letter, answer: existing?.answer ?? "" };
    });

    const isSame =
        nextBlanks.length === question.blanks.length &&
        nextBlanks.every((blank, index) => blank.id === question.blanks[index]?.id);

    if (!isSame) {
        update("blanks", nextBlanks);
    }
    
}, [detectedKey]);


        // Helper to find the next letter based on existing blanks
        const nextLetter = (existingLetters: string[]): string | null => {
    const maxCode = existingLetters.reduce(
        (max, letter) => Math.max(max, letter.charCodeAt(0)),
        "A".charCodeAt(0) - 1
    );
    const nextCode = maxCode + 1;
    if (nextCode > "Z".charCodeAt(0)) return null;
    return String.fromCharCode(nextCode);
};


        

    const removeBlank = (id: string) => {
        update(
            "blanks",
            question.blanks.filter((blank) => blank.id !== id)
        );
    };

    
const insertBlank = () => {
    const letter = nextLetter(analysis.validLetters);
    if (!letter) return;

    const marker = `[${letter}]`;
    const textarea = textareaRef.current;

    if (textarea) {
        const start = textarea.selectionStart ?? question.content.length;
        const end = textarea.selectionEnd ?? question.content.length;
        const newContent = `${question.content.slice(0, start)}${marker}${question.content.slice(end)}`;
        update("content", newContent);

        requestAnimationFrame(() => {
            textarea.focus();
            const cursor = start + marker.length;
            textarea.setSelectionRange(cursor, cursor);
        });
    } else {
        const spacer = question.content && !question.content.endsWith(" ") ? " " : "";
        update("content", `${question.content}${spacer}${marker}`);
    }
};

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl tracking-widest">Description / Template</h2>
                    <p className="text-sm text-default-border">
                        Write the question text, then use "Insert Blank" to drop numbered gaps like{" "}
                        <span className="text-system-red">[A]</span> where candidates must fill in an answer.
                    </p>
                </div>
                {/* Load Example button */}
            </div>

            <div className="rounded-lg border border-tertiary-surface bg-secondary-surface p-4 space-y-3">
                <textarea
                    ref={textareaRef}
                    value={question.content}
                    onChange={(event) => update("content", event.target.value)}
                    placeholder={"e.g. SELECT * FROM users [A] age > 18 [B] status = 'active';"}
                    className="w-full min-h-40 p-4 bg-background border border-default-border rounded text-default-text text-sm font-mono focus:outline-none focus:border-system-red transition-colors resize-y"
                />

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={insertBlank}
                        className="flex items-center gap-2 rounded bg-system-red px-4 py-2 font-staatliches tracking-widest text-sm cursor-pointer hover:brightness-110 transition-all"
                    >
                        <Plus size={16} />
                        <span>Insert Blank</span>
                    </button>

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs uppercase tracking-wider text-default-border">
                            Detected Blanks:
                        </span>
                        {question.blanks.length === 0 ? (
                            <span className="text-xs text-default-border/70">None yet</span>
                        ) : (
                            question.blanks.map((blank) => (
                                <span
                                    key={blank.id}
                                    className="px-2 py-0.5 rounded border border-status-success/40 bg-status-success/10 text-status-success text-xs font-staatliches tracking-wider"
                                >
                                    [{blank.id.slice(0, 1)}]
                                </span>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm uppercase tracking-wider text-default-border">Accepted Answers</h3>

                {question.blanks.length === 0 ? (
                    <p className="text-sm text-default-border/70 italic">
                        No blanks yet — click "Insert Blank" above to add one.
                    </p>
                ) : (
                    question.blanks.map((blank) => (
                        <div
                            key={blank.id}
                            className="flex items-center gap-4 rounded-lg border border-tertiary-surface bg-secondary-surface p-4"
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-system-red/40 bg-system-red/10 text-system-red font-staatliches text-sm">
                                {blank.id.slice(0, 1).toUpperCase()}
                            </span>

                            <input
                                value={blank.answer}
                                onChange={(element) => updateBlank(blank.id, element.target.value)}
                                placeholder={`Accepted answer for [${blank.id.slice(0, 1).toUpperCase()}]`}
                                className="flex-1 rounded border border-default-border bg-background px-4 py-2 focus:border-system-red focus:outline-none"
                            />

                            <button
                                type="button"
                                onClick={() => removeBlank(blank.id)}
                                className="text-default-border hover:text-system-red transition-colors cursor-pointer"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}