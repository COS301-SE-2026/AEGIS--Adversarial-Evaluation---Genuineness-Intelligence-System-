'use client';
import { Editor } from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;                                        // Holds the text content
  setCode: React.Dispatch<React.SetStateAction<string>>; // React's state setter function type
}

export default function CodeEditorCard({ code, setCode}: CodeEditorProps) {

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        alert("Pasting is not allowed in the code editor.");
    }


    return (
        <div onPaste={handlePaste} className="border border-default-border rounded-md overflow-hidden">
            <Editor
                height="60vh"
                language="javascript"
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
    )
}