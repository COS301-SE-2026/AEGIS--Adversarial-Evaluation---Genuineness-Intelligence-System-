"use client"

import { Code2, ListChecks, FileText, BetweenHorizontalStart, X } from "lucide-react";
import { QuestionType } from "@/app/(admin)/types/question-builder"

interface QuestionTypeModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (type: QuestionType) => void;
}

const Question_Types = [
    {
        type: "CODING" as const,
        title: "Coding Problem",
        description: "Set a programming challenge with starter code and automated test cases.",
        icon: Code2,
    },
    {
        type: "MCQ" as const,
        title: "Multiple Choice",
        description: "Set a single or multiple correct answers from muliple selectable options",
        icon: ListChecks,
    },
    {
        type: "COMPREHENSION" as const,
        title: "Comprehension and Reasoning",
        description: "Long-form written response using rubrics and keywords.",
        icon: FileText,
    },
    {
        type: "FILL_BLANKS" as const,
        title: "Fill in the Blanks",
        description: "Create sentences with missing words that candidates complete.",
        icon: BetweenHorizontalStart,
    }
];

export default function QuestionTypeModal({open, onClose, onSelect}: QuestionTypeModalProps) {
    if(!open) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl border border-tertiary-surface bg-secondary-surface shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
                
                <div className="flex items-start justify-between gap-4 border-b border-tertiary-surface p-6 md:p-8">
                    <div>
                        <h2 className="text-2xl tracking-widest">
                            Create Question
                        </h2>
                        <p className="mt-1 text-sm text-default-border">
                            Select the type of question you would like to build
                        </p>
                    </div>

                    <button 
                        onClick={onClose}
                        className="text-default-border hover:text-system-red transition-colors cursor-pointer"
                    >
                        <X size={22}/>
                    </button>
                </div>

                <div className="grid gap-6 p-6 md:p-8 [grid-cols:reapeat(auto-fit,minmax(260px,1fr))]">
                    {Question_Types.map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.type}
                                type="button"
                                onClick={() => onSelect(item.type)}
                                className="flex flex-col h-full group rounded-xl border-default-border/40 bg-background p-6 transition-all duration-200 hover:border-system-red hover:-translate-y-1 cursor-pointer"
                            >
                                <div className="flex items-center justify-center mb-4 rounded-lg">
                                    <Icon 
                                        size={24}
                                        className="text-system-red"
                                    />
                                </div>
                                <h3 className="text-xl tracking-widest text-default-text">
                                    {item.title}
                                </h3>
                                <p className="flex-1 mt-3 text-sm leading-6 text-default-border">
                                    {item.description}
                                </p>
                            </button>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}