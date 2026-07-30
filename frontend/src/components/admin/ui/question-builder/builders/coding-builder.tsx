"use client"

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import TestCaseCard from '../test-case-card'
import EditorPanel, { normalizeStarterCode } from "@/components/admin/ui/input/editor-panel";
import { QuestionBuilderState } from "@/app/(admin)/types/question-builder";
import { apiPost } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";

type CodingBuilderProps = Readonly <{
    question: QuestionBuilderState;
    update<K extends keyof QuestionBuilderState>(
        key: K,
        value: QuestionBuilderState[K]
    ) : void;
}>

type CodeExecutionResponse = {
    source_code: string;
    stdout: string;
    stderr: string;
    compiled: boolean;
    error_message: string | null;
}

function buildStarterSkeleton(functionSignature: string): string {
    const trimmedSignature = functionSignature.trim();
    if (!trimmedSignature) {
        return "def solve():\n    # your code here\n    ";
    }
    const signatureLine = trimmedSignature.endsWith(":")
        ? trimmedSignature
        : `${trimmedSignature}:`;

    return `${signatureLine}\n    # your code here\n    `;
}

function getSignatureBody(functionSignature: string): string {
    const trimmedSignature = functionSignature.trim();
    if (!trimmedSignature) {
        return "";
    }
    return trimmedSignature
        .replace(/^(async\s+)?def\s+/, "")
        .replace(/:\s*$/, "")
        .trim();
}

function buildQuestionMetadata(question: QuestionBuilderState) {
    if (!question.functionSignature.trim()) {
        return null;
    }
    return {
        function_signature: question.functionSignature.trim(),
    };
}

export default function CodingBuilder({question, update}: CodingBuilderProps) {
    const [draftInput, setDraftInput] = useState<string>("");
    const [draftHidden, setDraftHidden] = useState(false);
    const [isAddingTestCase, setIsAddingTestCase] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    const starterSkeleton = useMemo(() => {
        return buildStarterSkeleton(question.functionSignature);
    }, [question.functionSignature]);

    const signatureBody = useMemo(() => getSignatureBody(question.functionSignature), [question.functionSignature]);

    useEffect(() => {
        const normalizedStarterCode = normalizeStarterCode(question.starterCode || starterSkeleton, starterSkeleton);
        if (normalizedStarterCode !== question.starterCode) {
            update("starterCode", normalizedStarterCode);
        }
    }, [question.starterCode, starterSkeleton, update]);

    const handleAddTestCase = async () => {
        const trimmedInput = draftInput.trim();
        if (!trimmedInput) {
            setAddError("Enter a Python literal input before adding the test case.");
            return;
        }
        const metadata = buildQuestionMetadata(question);
        if (!metadata) {
            setAddError("Add a function signature first so the input can be executed.");
            return;
        }

        if (!question.starterCode.trim()) {
            setAddError("The starter code is empty. Add the function body before running the input.");
            return;
        }
        setIsAddingTestCase(true);
        setAddError(null);

        try {
            const response = await apiPost<CodeExecutionResponse>(
                "/api/v1/questions/source/execute",
                {
                    question_metadata: metadata,
                    implementation: question.starterCode,
                    input_data: trimmedInput,
                    language: "python",
                },
                {
                    headers: getAuthHeaders(),
                }
            );

            if (!response.compiled || response.error_message) {
                setAddError(response.error_message || "The starter code failed to execute for this input.");
                return;
            }

            update("testCases", [
                ...question.testCases,
                {
                    id: crypto.randomUUID(),
                    input: trimmedInput,
                    expectedOutput: response.stdout.trim(),
                    hidden: draftHidden,
                },
            ]);

            setDraftInput("");
            setDraftHidden(false);
        } catch (error) {
            setAddError(error instanceof Error ? error.message : "Failed to validate the test case.");
        } finally {
            setIsAddingTestCase(false);
        }
    };
    
    return (
        <div className="rounded-lg border border-tertiary-surface">
            <div className="space-y-8">
                <div className="space-y-5 rounded-lg border border-tertiary-surface bg-secondary-surface p-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-default-border">
                            Function Signature
                        </label>
                        <div className="flex items-stretch overflow-hidden rounded border border-default-border bg-background font-jetbrains-mono text-sm focus-within:border-system-red">
                            <span className="flex items-center border-r border-default-border/70 bg-secondary-surface px-3 text-default-border select-none">
                                def
                            </span>
                            <input
                                type="text"
                                value={signatureBody}
                                onChange={(event) => {
                                    const trimmedBody = event.target.value.trim();
                                    update("functionSignature", `def ${trimmedBody || "solve()"}:`);
                                }}
                                placeholder="two_sum(nums, target)"
                                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none"
                            />
                            <span className="flex items-center border-l border-default-border/70 bg-secondary-surface px-3 text-default-border select-none">
                                :
                            </span>
                        </div>
                        <p className="text-xs text-default-border">
                            Enter only the function name and parameters. The &apos;def&apos; keyword and colon are fixed.
                        </p>
                    </div>
                </div>

                <EditorPanel
                    correctAnswer={question.starterCode || starterSkeleton}
                    starterSkeleton={starterSkeleton}
                    setCorrectAnswer={(value) => update("starterCode", normalizeStarterCode(value, starterSkeleton))}
                />

                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl tracking-widest">
                            Test Cases
                        </h2>
                    </div>

                    <div className="rounded-lg border border-tertiary-surface bg-secondary-surface p-5 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm uppercase tracking-wider text-default-border">
                                Python Literal Input
                            </label>
                            <textarea
                                value={draftInput}
                                onChange={(event) => setDraftInput(event.target.value)}
                                placeholder='([1, 2], 3)'
                                className="w-full min-h-5 rounded border border-default-border bg-background p-3 text-sm font-jetbrains-mono focus:border-system-red focus:outline-none"
                            />
                            <p className="text-xs text-default-border">
                                Enter the input python literal exactly as the execute service should receive it.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddTestCase}
                            disabled={isAddingTestCase}
                            className="flex items-center gap-2 rounded bg-system-red px-4 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={16}/>
                            <h3>{isAddingTestCase ? "Running..." : "Add Test Case"}</h3>
                        </button>

                        {addError && (
                            <p className="text-xs text-system-red">{addError}</p>
                        )}
                    </div>

                    <div className="space-y-5">

                        {question.testCases.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-default-border p-10 text-center text-default-border">
                                No test cases added yet.
                            </div>
                        ) :  (
                            question.testCases.map((testCase, index) => (
                                <TestCaseCard
                                    key={testCase.id}
                                    index={index}
                                    testCase={testCase}
                                    onDelete={() => {
                                        update("testCases", question.testCases.filter((tc) => tc.id !== testCase.id))
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}