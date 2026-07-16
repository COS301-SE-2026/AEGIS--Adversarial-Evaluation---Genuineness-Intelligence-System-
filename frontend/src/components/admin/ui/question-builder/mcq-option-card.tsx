"use client"

import { Trash2 } from "lucide-react";
import { MCQOption } from "@/app/(admin)/types/question-builder";

interface MCQOptionCardProps {
    option: MCQOption;
    index: number;
    onChange: (option: MCQOption) => void;
    onDelete: () => void;
    disabled?: boolean;
}

export default function MCQOptionCard({option, index, onChange, onDelete, disabled = false}: MCQOptionCardProps){
    return (
        <div className="flex items-center gap-4 rounded-lg border border-tertiary-surface bg-secondary-surface p-4">
            <input
                type="radio"
                name="correct-option"
                checked={option.isCorrect}
                onChange={() => onChange({...option, isCorrect: true})}
                className="h-5 w-5 cursor-pointer"
            />
            <input
                type="text"
                value={option.text}
                placeholder={`Option ${String.fromCharCode(65 + index)}...`}
                onChange={(element) => onChange({...option, text: element.target.value})}
                className="flex-1 rounded border border-default-border bg-background px-4 py-2 text-sm focus:border-system-red focus:outline-none"
            />

            <button
                type="button"
                onClick={onDelete}
                disabled={disabled}
                className="text-default-border transition-colors hover:text-system-red"
            >
                <Trash2 size={18}/>
            </button>
            
        </div>
    )
}