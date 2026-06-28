"use client"

import { useState } from "react"
import { Play, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import Editor from "@monaco-editor/react"
import { StringifyOptions } from "querystring"

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
            setConsoleOutput("ERROR: Solution canvas cannot be vacant.")
            return;
        }

        setTestStatus("testing");
        setConsoleOutput("SANDBOX INITIALIZING... \n Running compiler suite aganinst test cases....")

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
        <div className="">
            <div className="">
                <h2 className="">
                    Description
                </h2>
                <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Describe the constraints, requirements and edge cases here..."
                    className=""
                />
            </div>

            <div className="">
                <div className="">
                    <h2 className="">
                        Solution Architecture
                    </h2>

                    <select
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                        className=""
                    >
                        <option value="python">Python</option> {/*in future add a prop with all possible coding languages supported */}
                    </select>
                </div>

                <div className="">
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

                <div className="">
                    <div className="">
                        <div className="">
                            {testStatus === "idle" && (
                                <span className="">
                                    <Loader2 size={14} className=""/> Untested
                                </span>
                            )}
                            {testStatus === "testing" && (
                                <span className="">
                                    <Loader2 size={14} className=""/> Sandbox Running...
                                </span>
                            )}
                            {testStatus === "passed" && (
                                <span className="">
                                    <Loader2 size={14} className=""/> Solution Verified
                                </span>
                            )}
                            {testStatus === "failed" && (
                                <span className="">
                                    <Loader2 size={14} className=""/> Compilation Error
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleSandboxExecution}
                            disabled={testStatus === "testing"}
                            className=""
                        >
                            <Play size={11} fill="currentColor"/>
                            Run Test
                        </button>
                    </div>

                    {consoleOutput && (
                        <pre className="">

                        </pre>
                    )}
                </div>
            </div>
        </div>
    )

}