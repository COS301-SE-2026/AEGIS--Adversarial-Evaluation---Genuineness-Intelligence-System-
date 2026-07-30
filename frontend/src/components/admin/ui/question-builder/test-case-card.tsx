"use client"

import { Trash2 } from "lucide-react";
import { TestCase } from "@/app/(admin)/types/question-builder";

interface TestCardProps {
    testCase: TestCase;
    index: number;
    onDelete: () => void;
}

export default function TestCaseCard({testCase, index, onDelete}: TestCardProps) {
    return (
        <div className="rounded-lg border border-tertiary-surface bg-secondary-surface p-5 space-y-5">
    
            <div className="flex items-center justify-between gap-3">
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
                <div className="text-sm uppercase tracking-wider text-default-border">
                    Python Literal Input
                </div>
                <pre
                    className="w-full min-h-20 rounded border border-default-border bg-background p-3 text-sm font-jetbrains-mono whitespace-pre-wrap"
                >
                    {testCase.input}
                </pre>
            </div>

            <div className="space-y-2">
                <span className="text-xs uppercase tracking-wider text-default-border">
                    Captured Output
                </span>
                <pre className="w-full min-h-20 rounded border border-default-border bg-background p-3 text-sm text-default-text whitespace-pre-wrap font-jetbrains-mono">
                    {testCase.expectedOutput || "Output will appear here after validation."}
                </pre>
            </div>
        </div>
    )
}