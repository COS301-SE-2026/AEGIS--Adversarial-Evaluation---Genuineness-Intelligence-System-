"use client";
import { useEffect, useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { apiPost } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";

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
  return (
    normalized.includes("traceback (most recent call last)") ||
    normalized.includes("nameerror:")
  );
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
      editorDisposablesRef.current.forEach((disposable) =>
        disposable.dispose(),
      );
      editorDisposablesRef.current = [];
    };
  }, []);

  const handleEditorMount: NonNullable<
    React.ComponentProps<typeof Editor>["onMount"]
  > = (editor, monaco) => {
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
        const isDeleteKey =
          event.browserEvent.key === "Backspace" ||
          event.browserEvent.key === "Delete";
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
  };

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

      const authToken = getToken() ?? undefined;

      const response = await apiPost<
        ExecuteResponse,
        {
          candidate_assessment_id: number;
          assessment_question_id: number;
          code: string;
        }
      >(
        "/api/v1/assessments/execute",
        {
          candidate_assessment_id: candidateAssessId,
          assessment_question_id: questionId,
          code,
        },
        authToken ? { authToken } : {},
      );

      const results = response?.results;
      if (
        Array.isArray(results) &&
        results.some((item) => item?.error_message)
      ) {
        const firstError =
          results.find((item) => item?.error_message)?.error_message?.trim() ??
          "";
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
          failed === 0
            ? "All Test Cases Passed"
            : "At Least One Test Case Failed.",
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

  const cleanSignature = functionSignature?.replace(/^def\s+/g, '').trim() || ''; //remove an (^def) leading 'def' and any (\s+) following whitespace
  const funcName = cleanSignature?.split("(")[0] || "function_name";
  const funcArgs = cleanSignature?.split("(")[1]?.split(")")[0] || "args";

  return (
    <div
      onPaste={handlePaste}
      className="flex flex-col h-[85vh] min-h-150 bg-secondary-surface border border-tertiary-surface rounded-lg overflow-hidden "
    >
      <div className="flex items-center justify-between h-12 bg-background border-b border-tertiary-surface px-4 shrink-0">
        <div className="flex items-center gap-2 text-default-text text-sm font-jetbrains-mono">
          <svg
            className="w-4 h-4 text-status-info"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M11.914 0C5.82 0 6.2 2.656 6.2 2.656l.007 2.752h5.814v.826H3.9S0 5.789 0 11.969c0 6.18 3.403 5.96 3.403 5.96h2.03v-2.867s-.109-3.42 3.35-3.42h5.765s3.24.052 3.24-3.148V3.202S18.28 0 11.914 0zM8.708 1.85c.578 0 1.046.47 1.046 1.052 0 .581-.468 1.052-1.046 1.052-.578 0-1.046-.47-1.046-1.052 0-.581.468-1.052 1.046-1.052z" />
            <path d="M23.96 11.969c0-6.18-3.403-5.96-3.403-5.96h-2.03v2.867s.109 3.42-3.35 3.42H9.412s-3.24-.053-3.24 3.148v5.292S5.68 24 12.046 24c6.094 0 5.714-2.656 5.714-2.656l-.007-2.752h-5.814v-.826h8.121S24 18.211 24 12.031zM15.252 22.15c-.578 0-1.046-.47-1.046-1.052 0-.581.468-1.052 1.046-1.052.578 0 1.046.47 1.046 1.052 0 .581-.468 1.052-1.046 1.052z" />
          </svg>
          <span className="font-medium">solution.py</span>
        </div>

        <button
          type="button"
          onClick={handleRunClick}
          disabled={isRunning}
          className="flex items-center gap-2 px-5 py-2 bg-status-info disable:opacity-50 disabled:cursor-not-allowed text-background text-sm font-bold rounded-md transition-all"
        >
          {isRunning ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12Hc0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Running...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Run Code</span>
            </>
          )}
        </button>
      </div>

      <div className="px-4 py-3 bg-secondary-surface border-b border-tertiary-surface shrink-0">
        <p className="text-sm text-default-border ">
          For {questionTitle ?? "this question"}, implement the fucntion in
          Python
        </p>
        <div className="flex items-center gap-2 mt-2 font-jetbrains-mono text-default-text bg-code-editor px-3 py-2 rounded border border-default-border text-[13px] ">
          <span className="text-status-info">def</span>
          <span className="text-status-warning">{funcName}</span>
          <span className="text-default-text/80">({funcArgs}): </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative bg-code-editor">
        <Editor
          height="100%"
          width="100%"
          language="python"
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode(value || "")}
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
            fontFamily: " 'JetBrains Mono', 'Fira Code', 'Consolas', monospace ",
            automaticLayout: true,
            padding: {top: 16}
          }}
        />
      </div>

      <div className="flex flex-col h-40 min-h-38 bg-secondary-surface border-t border-tertiary-surface shrink-0">
          <div className="flex items-center h-9 px-4 bg-background border-b border-tertiary-surface">
            <h3 className="text-xs font-ibm uppercase tracking-wider text-default-text/80">
                Test Results
            </h3>
          </div>
          
          <div className="flex-1 p-4 overflow-auto font-jetbrains-mono text-sm">
            {runSummary.status === "result" ? (

                <div className="space-y-3 font-bold">
                    <p className={`text-base ${runSummary.failed === 0 ? 'text-status-success' : 'text-system-red'}`}>
                        {runSummary.message}
                    </p>
                    <div className="flex gap-6 text-default-text/80 text-[13px]">
                        <span>Passed: <span className="text-status-success"></span>{runSummary.passed} </span>
                        <span>Failed: <span className="text-system-red"></span>{runSummary.failed} </span>
                        <span>Total: <span>{runSummary.total}</span> </span>
                    </div>
                </div>
                
            ) : runSummary.status === "error" ? (

                <div className="text-system-red whitespace-pre-wrap leading-relaxed">
                    <span className="font-bold">Error</span> {runSummary.message}
                </div>

            ) : runSummary.status === "running" ? (
                <div className="flex items-center gap-2 text-status-info">
                    <svg
                        className="animate-spin h-3.5 w-3.5 text-status-info"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12Hc0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    {runSummary.message}
                </div>
            ) : (
                <p className="text-default-border italic">{runSummary.message}</p>
            )}
          </div>

      </div>

    </div>
  );
}
