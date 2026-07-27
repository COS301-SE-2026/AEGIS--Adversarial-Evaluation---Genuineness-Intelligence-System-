"use client"

import { MCQOption } from "@/app/(admin)/types/question-builder";

interface MCQOptionCardProps {
    option: MCQOption;
    index: number;
    onChange: (text: string) => void;
    onSelect: () => void;
}

export default function MCQOptionCard({option, index, onChange, onSelect}: MCQOptionCardProps){
    return (
        <div className="flex items-center gap-4 rounded-lg border border-tertiary-surface bg-secondary-surface p-4">
            <input
                type="radio"
                name="correct-option"
                checked={option.isCorrect}
                onChange={onSelect}
                className="h-5 w-5 cursor-pointe accent-system-red"
            />
            <input
                type="text"
                value={option.text}
                placeholder={`Option ${String.fromCharCode(65 + index)}...`}
                onChange={(element) => onChange(element.target.value)}
                className="flex-1 rounded border border-default-border bg-background px-4 py-2 text-sm focus:border-system-red focus:outline-none"
            />
        </div>
    )
}