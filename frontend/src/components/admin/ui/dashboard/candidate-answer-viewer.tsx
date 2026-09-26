"use client"

import { QuestionAnalytics } from "@/app/(admin)/types/metrics";

interface CandidateAnswerViewerProps {
    question: QuestionAnalytics;
}

export function CandidateAnswerViewer({ question }: Readonly<CandidateAnswerViewerProps>) {
    if(!question.answered || !question.answer) {
        return (
            <div className="flex items-center justify-center h-40 bg-secondary-surface border-2 border-dashed border-default-border text-sm">
                Candidate did not answer this question.
            </div>
        )
    }

    if(question.type === "CODING") {
        return (
            <div className="bg-code-editor border border-tertiary-surface rounded-lg p-4 font-jetbrains-mono text-sm text-default-text whitespace-pre-wrap overflow-auto max-h-75">
                {question.answer.candidate_answer}
            </div>
        )
    }

    if(question.type === "MULTIPLE_CHOICE") {
        return (
            <div className="flex flex-col gap-3">
                {question.options?.map((option) => {
                    const isSelected = question.answer?.candidate_answer === option;
                    const isCorrect = question.correct_answer === option;

                    return(
                        <div
                            key={option}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-all
                                ${isSelected
                                    ? "border-status-info text-status-info"
                                    : "bg-secondary-surface border-tertiary-surface text-default-text/80"
                            }`}
                        >
                            <div className={`flex items-center justify-center shrink-0 w-4 h-4 rounded-full border-2 ${isSelected} ? "border-status-info" : "border-default-border" `}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-status-info"/>}
                            </div>
                            <span className="flex-1">{option}</span>
                            {isCorrect && <span className="text-sm font-bold text-status-success">Correct</span>}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="bg-code-editor border border-tertiary-surface rounded-lg p-4 font-jetbrains-mono text-sm text-default-text whitespace-pre-wrap">
            {question.answer.candidate_answer}
        </div>
    )
}