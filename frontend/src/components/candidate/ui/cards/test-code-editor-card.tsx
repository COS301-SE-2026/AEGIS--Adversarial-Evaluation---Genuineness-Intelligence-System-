'use client';
import { Editor } from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;                                        // Holds the text content
  setCode: React.Dispatch<React.SetStateAction<string>>; // React's state setter function type
  onRun?: (code: string) => void;                      // Optional callback to execute the code
}

export default function CodeEditorCard({ code, setCode, onRun }: CodeEditorProps) {
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        alert("Pasting is not allowed in the code editor.");
    }

    const handleRunClick = () => {
        if (onRun) {
            onRun(code);
        } else {
            console.log("Running code:", code);
        }
    }

    return (
        <div onPaste={handlePaste} className="flex flex-col border border-default-border rounded-md overflow-hidden">
            <div className="flex-1">
                <Editor
                    height="60vh"
                    language="python"
                    value={code}
                    theme="vs-dark"
                    onChange={(value) => setCode(value || '')}
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

            <div className="flex justify-end items-center p-3 bg-neutral-900 border-t border-default-border">
                <button
                    onClick={handleRunClick}
                    className="px-4 py-2 bg-emerald-600"
                >
                    Run Code
                </button>
            </div>
        </div>
    )
}