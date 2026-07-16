"use client"

import { QuestionBuilderState } from "@/app/(admin)/types/question-builder";

interface ComprehensionBuilderProps {
    question: QuestionBuilderState;
    update<K extends keyof QuestionBuilderState>(
        key: K,
        value: QuestionBuilderState[K]
    ) : void;
}

export default function ComprehensionBuilder({question, update}: ComprehensionBuilderProps){
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-xl tracking-widest">
                    Marking Rubric
                </h2>
                <p className="text-sm" text-default-border>
                    Describe how this answer should be graded.
                </p>
                <textarea
                    value={question.rubric}
                    onChange={(element) => update("rubric", element.target.value)}
                    placeholder="Example: Explanins time complexity, metions memory usage, gives a valid example."
                    className="min-h-52 w-full rounded-lg border border-default-border bg-background p-4 focus:border-system-red focus:outline-none"
                />
            </div>

            <div className="space-y-2">
                <h2 className="text-xl tracking-widest">
                    Expected Keywords
                </h2>
                <p className="text-sm default-border">
                    Seperate keywords with commas.
                </p>
                <input
                    type="text"
                    value={question.expectedKeywords.join(", ")}
                    onChange={(element) => update("expectedKeywords", element.target.value.split(",").map((word)=> word.trim()).filter(Boolean))}
                    placeholder="algorithm, recursion, stack..."
                    className="w-full rounded border border-default-border bg-background px-4 py-2 focus:border-system-red focus:outline-none"
                />
            </div>
        </div>
    )
}