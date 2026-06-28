"use client"

import { useState } from "react"
import { Play, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import Editor from "@monaco-editor/react"


interface EditorPanelProps {
    content: string,
    setContent: (value: string) => void,
    correctAnswer: string,
    setCorrectAnswer: (value: string) => void
}

type ValidationStatus = "idle" | "testing" | "passed" | "failed"

export default function EditorPanel ({
    content, setContent,
    correctAnswer, setCorrectAnswer
}: EditorPanelProps) {
    const [testStatus, setTestStatus] = useState<ValidationStatus>("idle");
    const [consoleOutput, setConsoleOutput] = useState<string>("");
    const [language, setLanguage] = useState<string>("python");

    const handleSandboxExecution = () => {
        if(!correctAnswer.trim()) {
            setTestStatus("failed");
            setConsoleOutput("Solution canvas cannot be vacant.")
            return;
        }

        setTestStatus("testing");
        setConsoleOutput("Running compiler suite aganinst test cases....")

        setTimeout(() => {
        //set up actual api for this
        //mock api is below
        if(correctAnswer.includes("def") || correctAnswer.includes("function")) {
            setTestStatus("passed");
            setConsoleOutput("Question is safe to deploy.");
        }
        else {
            setTestStatus("failed");
            setConsoleOutput("Question is unsafe to deploy.");
        }
        }, 1600);
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex-1 flex flex-col bg-secondary-surface p-6 rounded-lg border border-tertiary-surface">
                <h2 className="text-xl text-default-text tracking-wider border border-tertiary-surface pb-2 mb-4">
                    Description
                </h2>
                <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Describe the constraints, requirements and edge cases here..."
                    className="w-full flex-1 min-h-30 p-4 bg-background border border-default-border rounded text-default-text text:sm focus:outline-none focus:border-system-red transition-colors resize-y"
                />
            </div>

            <div className="flex-1 flex flex-col bg-secondary-surface p-6 rounded-lg border border-tertiary-surface">
                <div className="flex justify-between items-center border-b border-tertiary-surface">
                    <h2 className="text-xl text-default-text tracking-wider">
                        Solution Architecture
                    </h2>

                    <select
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                        className="font-jetbrains-mono text-[12px] bg-background border-default-border/45 text-status-info px-2 py-1 rounded uppercase focus:border-system-red cursor-pointer shadow-sm"
                    >
                        <option value="python">Python</option> {/*in future add a prop with all possible coding languages supported */}
                    </select>
                </div>

                <div className="w-full flex-1 min-h-60 rounded border border-default-border overflow-hidden bg-tertiary-surface">
                    <Editor
                        height="240px"
                        theme="vs-dark"
                        language={language}
                        value={correctAnswer}
                        onChange={(newValue) => setCorrectAnswer(newValue || "")}
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

                <div className="mt-4 pt-4 border-t border-default-border space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {testStatus === "idle" && (
                                <span className=" text-default-border uppercase font-jetbrains text-xs">
                                    Untested
                                </span>
                            )}
                            {testStatus === "testing" && (
                                <span className="">
                                    <Loader2 size={14} className="flex items-center gap-2 font-jetbrains text-xs text-status-warning animate-pulse"/> Sandbox Running...
                                </span>
                            )}
                            {testStatus === "passed" && (
                                <span className="">
                                    <CheckCircle2 size={14} className="flex items-center gap-2 font-jetbrains text-xs text-status-success"/> Solution Verified
                                </span>
                            )}
                            {testStatus === "failed" && (
                                <span className="">
                                    <AlertTriangle size={14} className="flex items-center gap-2 font-jetbrains text-xs text-system-red"/> Compilation Error
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleSandboxExecution}
                            disabled={testStatus === "testing"}
                            className="bg-default-text text-background hover:bg-transparent hover:text-system-red hover:border-system-red  px-4 py-2 transition-colors duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Play size={11} fill="currentColor"/>
                            Run Test
                        </button>
                    </div>

                    {consoleOutput && (
                        <pre className="p-3 bg-background rounded border border-tertiary-surface text-[12px] leading-relaxed text-default-border whitespace-pre-wrap max-h-30 overflow-y-auto">
                            {consoleOutput}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    )

}