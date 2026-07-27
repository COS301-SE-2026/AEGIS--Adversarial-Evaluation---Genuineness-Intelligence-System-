"use client"

import Editor from "@monaco-editor/react"
import { Code2 } from "lucide-react"


export interface EditorPanelProps {
    correctAnswer: string,
    starterSkeleton: string,
    setCorrectAnswer: (value: string) => void
}

export function normalizeStarterCode(
    starterCode: string,
    starterSkeleton: string,
): string {
    const skeletonLines = starterSkeleton.trimEnd().split("\n");
    const signatureLine = skeletonLines[0] ?? "def solve():";
    const codeLines = starterCode.split("\n");

    if (codeLines.length === 0) {
        return starterSkeleton;
    }
    const signaturePattern = /^(?:async\s+)?def\s+.*:\s*$/;
    let bodyStartIndex = 0;
    while (
        bodyStartIndex < codeLines.length &&
        (codeLines[bodyStartIndex]?.trim() === "" || signaturePattern.test(codeLines[bodyStartIndex].trim()))
    ) {
        bodyStartIndex += 1;
    }
    const bodyLines = codeLines.slice(bodyStartIndex);
    return [signatureLine, ...bodyLines].join("\n");
}

export default function EditorPanel ({correctAnswer, starterSkeleton, setCorrectAnswer}: EditorPanelProps) {
    const language = "python";

    return (
        <div className="space-y-6 h-full flex flex-col">

            <div className="flex-1 flex flex-col bg-secondary-surface p-6 rounded-lg border border-tertiary-surface">
                <div className="flex justify-between items-center border-b border-tertiary-surface">
                    <h2 className="flex items-center gap-2 text-xl text-default-text tracking-wider border-b border-tertiary-surface pb-2">
                        <Code2 size={18} />
                        Solution Architecture
                    </h2>

                    <span className="font-jetbrains-mono text-[12px] bg-background border border-default-border/45 text-status-info px-2 py-1 rounded uppercase shadow-sm">
                        Python
                    </span>
                </div>

                <div className="w-full flex-1 min-h-60 rounded border border-default-border overflow-hidden bg-tertiary-surface mt-4">
                    <Editor
                        height="240px"
                        theme="vs-dark"
                        language={language}
                        value={correctAnswer}
                        onChange={(newValue) => setCorrectAnswer(normalizeStarterCode(newValue || "", starterSkeleton))}
                        options={{
                            minimap: {enabled:false},
                            fontSize: 13,
                            fontFamily: "var(--font-jetbrains-mono), momospace",
                            lineNumbers: "on",
                            automaticLayout: true,
                            padding: {top: 12, bottom: 12},
                            scrollbar: {
                                vertical: "auto",
                                horizontal: "auto",
                                verticalScrollbarSize: 8, 
                                horizontalScrollbarSize:8},
                            wordWrap: "on",
                            folding: false,
                            glyphMargin: false,
                            lineDecorationsWidth: 10,
                            hideCursorInOverviewRuler: true,
                            overviewRulerBorder: false
                        }}
                    />
                </div>
                <p className="mt-7 text-s text-default-border">
                    The code will be executed when a test case is added, then the captured output will be staged with that input.
                </p>
            </div>
        </div>
    )

}