"use client"

import { QuestionAnalytics, REVIEW_BAND_META } from "@/app/(admin)/types/metrics";

interface QuestionNavigatorProps {
    questions: QuestionAnalytics[];
    selectedQuestionId: number;
    onSelectQuestion: (id: number) => void;
}

export function QuestionNavigator({questions, selectedQuestionId, onSelectQuestion}: Readonly<QuestionNavigatorProps>) {
    return (
        <div className="flex flex-col w-64 shrink-0 bg-secondary-surface border-r border-tertiary-surface">
            
            <div className="p-4 border-b border-tertiary-surface">
                <h3 className="text-sm tracking-widest text-default-text/90">
                    Questions
                </h3>
            </div>
            
            <div className="flex flex-col overflow-y-auto">
                {questions.map((question) => {

                    const isSelected = question.assessment_q_id === selectedQuestionId;
                    const bandColor = question.review_band ? REVIEW_BAND_META[question.review_band].color : "default-border"

                    return (
                        <button
                            key={question.assessment_q_id}
                            onClick={() => onSelectQuestion(question.assessment_q_id)}
                            className={`w-full text-left p-4 border-b border-tertiary-surface transition-all
                                ${isSelected ? "bg-code-editor" : "hover:bg-background border-l-4 border-l-transparent"
                                }`}
                            style={{ borderLeftColor: isSelected ? bandColor : undefined }}
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-xs font-bold text-default-text/90">
                                    Q{question.question_order}
                                </span>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bandColor }}/>
                            </div>
                            <h4 className="text-sm tracking-widest text-default-text">
                                {question.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-default-text/50">
                                
                                <span className="font-jetbrains-mono">
                                    <span>{question.answer?.score.toFixed(1) || 0}/{question.maximum_score}</span>
                                    {!question.answered && 
                                        <span className="text-default-border">Not Answered</span>
                                    }
                                </span>
                            </div>
                        </button>
                    )

                })}
            </div>
        </div>
    )   
}