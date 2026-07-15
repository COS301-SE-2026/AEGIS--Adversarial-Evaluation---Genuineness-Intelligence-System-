"use client"

import { Trash2 } from "lucide-react";
import { TestCase } from "@/app/(admin)/types/question-builder";

interface TestCardProps {
    testCase: TestCase;
    index: number;
    onChange: (testCase: TestCase) => void;
    onDelete: () => void;
}

export default function TestCaseCard({testCase, index, onChange, onDelete}: TestCardProps) {
    return (
        <div className="rounded-lg border border-tertiary-surface bg-secondary-surface p-5 space-y-5">
    
            <div className="flex items-center justofy-between">
                <h3 className="tracking-widest">
                    Test Case {index + 1}
                </h3>
                <button
                    type="button"
                    onClick={onDelete}
                    className="text-default-border hover:text-system-red transistion-colors cursor-pointer"
                >
                    <Trash2 size={18}/>
                </button>
            </div>

            <div className="space-y-2">
                <label className="text-sm uppercase tracking-wider text-default-border">
                    Test Input
                </label>
                <textarea
                    value={testCase.input}
                    onChange={(element) => onChange({...testCase, input: element.target.value})}
                    className="w-full min-h-28 rounded border border-default-border bg-background p-4"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-default-border">
                    Expected Output
                </label>
                <textarea
                    value={testCase.expectedOutput}
                    onChange={(element) => onChange({...testCase, expectedOutput: element.target.value})}
                    className="w-full min-h-28 rounded border border-default-border bg-background p-4"
                />
            </div>

            <label className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={testCase.hidden}
                    onChange={(element) => onChange({...testCase, hidden: element.target.checked})}
                />

                <span className="text-sm">
                    Hidden Test Case
                </span>
            </label>
        </div>
    )
}