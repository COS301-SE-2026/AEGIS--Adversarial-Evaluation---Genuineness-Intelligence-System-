'use client';
import { Question } from "./question.type";

type MultipleChoiceProps = {
    question: Question;
    value?: string;
    onChange?: (value: string) => void;
};

function indexToLetter(index: number): string {
    return String.fromCharCode(97 + index);
}

function letterToIndex(value?: string): number | null {
    if (!value) {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized.length !== 1) {
        return null;
    }

    const code = normalized.charCodeAt(0) - 97;
    return code >= 0 ? code : null;
}

export function TestMultipleChoiceCard({ question, value, onChange }: MultipleChoiceProps) {
    const options = question.options;
    const selectedIndex = letterToIndex(value);

    return (
        <div className="flex flex-col h-full">
            <div>
                <h3 className="text-base tracking-widest uppercase mt-4 mb-6">Choose The Most Correct answer</h3>
            </div>
            <div className="flex flex-col gap-4">
                {options.map((option, index) => (
                    <label 
                        key={index} 
                        className={`flex items-center gap-4 p-4 rounded-md cursor-pointer border-2 transition-colors ${
                            selectedIndex === index ? 'border-blue-500' : 'border-default-border'
                        }`}
                    >
                        <input
                            type="radio"
                            name={`multiple-choice-${question.questionId}`}
                            value={option}
                            checked={selectedIndex === index}
                            onChange={() => onChange?.(indexToLetter(index))}
                            className="hidden"
                        />
                        <span className="text-lg min-w-fit">{String.fromCharCode(65 + index)}.</span>
                        <span className="text-default-text">{option}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}