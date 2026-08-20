'use client';
import { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { apiPost } from "@/lib/apiClient"


interface CodeEditorProps {
    code: string;
    setCode: React.Dispatch<React.SetStateAction<string>>;
    questionId: number;
    candidateAssessId?: number | null;
    questionTitle?: string;
    functionSignature?: string;
    telemetry?: {
        recordPasteEvent: (pastedText: string) => void;
        recordDeleteEvent: (deletedCharacterCount: number) => void;
    };
}

type ExecuteResponse = {
    test_cases_passed?: number;
    test_cases_failed?: number;
    test_cases_total?: number;
    results?: Array<{
        passed?: boolean;
        error_message?: string | null;
    }>;
};


function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }
    return "Code did not compile successfully.";
}

function isPythonRuntimeTraceback(errorMessage: string): boolean {
    const normalized = errorMessage.toLowerCase();
    return normalized.includes("traceback (most recent call last)") || normalized.includes("nameerror:");
}

type MonacoRange = {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
};

type MonacoPasteEvent = {
    range: MonacoRange;
};

type MonacoKeyboardEvent = {
    browserEvent: KeyboardEvent;
};

export default function CodeEditorCard({
    code,
    setCode,
    questionId,
    candidateAssessId,
    questionTitle,
    functionSignature,
    telemetry,
}: CodeEditorProps) {

    type RunSummary =
    | { status: "idle" | "running" | "info" | "error"; message: string }
    | {
        status: "result";
        message: string;
        passed: number;
        failed: number;
        total: number;
      };

    const [runSummary, setRunSummary] = useState<RunSummary>({
        status: "idle",
        message: "Click Run Code To Test Your Code.",
    });
    const [isRunning, setIsRunning] = useState(false);
    const editorDisposablesRef = useRef<Array<{ dispose: () => void }>>([]);

    useEffect(() => {
        return () => {
            editorDisposablesRef.current.forEach((disposable) => disposable.dispose());
            editorDisposablesRef.current = [];
        };
    }, []);

    const handleEditorMount: NonNullable<React.ComponentProps<typeof Editor>["onMount"]> = (editor, monaco) => {
        editorDisposablesRef.current.forEach((disposable) => disposable.dispose());
        editorDisposablesRef.current = [];

        if (!telemetry) {
            return;
        }

        editorDisposablesRef.current.push(
            editor.onDidPaste((event: MonacoPasteEvent) => {
                const model = editor.getModel();
                if (!model) {
                    return;
                }

                const pastedText = model.getValueInRange(event.range);
                telemetry.recordPasteEvent(pastedText);
            }),
            editor.onKeyDown((event: MonacoKeyboardEvent) => {
                console.log("monaco keydown", event.browserEvent.key);
                const isDeleteKey = event.browserEvent.key === "Backspace" || event.browserEvent.key === "Delete";
                if (!isDeleteKey) {
                    return;
                }

                const selection = editor.getSelection();
                if (!selection) {
                    telemetry.recordDeleteEvent(1);
                    return;
                }

                if (selection.isEmpty()) {
                    telemetry.recordDeleteEvent(1);
                    return;
                }

                const model = editor.getModel();
                if (!model) {
                    telemetry.recordDeleteEvent(1);
                    return;
                }

                const deletedText = model.getValueInRange(selection);
                telemetry.recordDeleteEvent(deletedText.length);
            }),
        );
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        alert("Pasting is not allowed in the code editor.");
    }

    const handleRunClick = async () => {
        if (!candidateAssessId) {
            setRunSummary({
                status: "info",
                message: "Candidate assessment is not ready yet.",
            });
            return;
        }

        try {
            setIsRunning(true);
            setRunSummary({
                status: "running",
                message: "Executing code...",
            });

            const response = await apiPost<ExecuteResponse, {
                candidate_assessment_id: number;
                assessment_question_id: number;
                code: string;
            }>(
                "/api/v1/assessments/execute",
                {
                    candidate_assessment_id: candidateAssessId,
                    assessment_question_id: questionId,
                    code,
                }
            );

            const results = response?.results;
            if (Array.isArray(results) && results.some((item) => item?.error_message)) {
                const firstError = results.find((item) => item?.error_message)?.error_message?.trim() ?? "";
                setRunSummary({
                    status: "error",
                    message:
                        firstError && !isPythonRuntimeTraceback(firstError)
                            ? firstError
                            : "Code did not compile successfully, please fix your code\nand ensure that you use the correct function name",
                });
                return;
            }

            const passed = response?.test_cases_passed ?? 0;
            const failed = response?.test_cases_failed ?? 0;
            const total = response?.test_cases_total ?? 0;

            setRunSummary({
                status: "result",
                message:
                    failed === 0 ? "All Test Cases Passed" : "At Least One Test Case Failed.",
                passed,
                failed,
                total,
            });
        } catch (error) {
            setRunSummary({
                status: "error",
                message: getErrorMessage(error),
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div onPaste={handlePaste} className="flex flex-col border border-default-border rounded-md overflow-hidden">
                        <div className="bg-white-300 border-b border-white-700 p-3">
                                <p className="text-m text-white-600 mb-2">
                                <strong>Important:</strong> For {questionTitle ?? "this question"}, implement the function in Python and define the function with the expected name.
                                </p>
                                <p className="text-m text-white-600 font-mono bg-grey-600 p-2 rounded">
                            {functionSignature || "Function signature not available."}
                                </p>
                        </div>
            <div className="flex-1">
                <Editor
                    height="40vh"
                    language="python"
                    value={code}
                    theme="vs-dark"
                    onChange={(value) => setCode(value || '')}
                    onMount={handleEditorMount}
                    options={{
                        quickSuggestions: false,
                        suggestOnTriggerCharacters: false,
                        parameterHints: { enabled: false },
                        wordBasedSuggestions: "off",
                        inlineSuggest: { enabled: false },
                        snippetSuggestions: "none",
                        contextmenu: false,
                        minimap: { enabled: false },
                        fontSize: 14,
                        automaticLayout: true,
                    }}
                />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-default-border bg-neutral-900 p-3">
                <div className="min-h-5 text-xs text-white whitespace-pre-wrap">
                    {runSummary.status === "result" ? (
                        <div className="space-y-1">
                            <p>{runSummary.message}</p>
                            <p>Passed: {runSummary.passed}</p>
                            <p>Failed: {runSummary.failed}</p>
                            <p>Total: {runSummary.total}</p>
                        </div>
                    ) : (
                        runSummary.message
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleRunClick}
                    disabled={isRunning}
                    className="px-4 py-2 bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isRunning ? "Running..." : "Run Code"}
                </button>
            </div>
        </div>
    )
}
