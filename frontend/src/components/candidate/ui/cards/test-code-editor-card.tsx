'use client';
import { Editor } from "@monaco-editor/react";
import { useState } from "react";
import { apiPost } from "@/lib/apiClient"
import { Play, Pause } from "lucide-react";


interface CodeEditorProps {
  code: string;                                        // Holds the text content
  setCode: React.Dispatch<React.SetStateAction<string>>; // React's state setter function type
}

export default function CodeEditorCard({ code, setCode }: CodeEditorProps) {

    const [language, setLanguage] = useState("python");
    const [output, setOutput] = useState("");
    const [running, setRunning] = useState(false);

    const languages = [
        { label: "Python", value: "python" },
    ];

    const handleRun = async () => { //change the actual api.
        try {
            setRunning(true);
            setOutput("");

            const response: string = await apiPost("/api/v1/code/run", {
                language,
                source_code: code,
            });

            setOutput(response);
        } 
        catch (error) {
            setOutput (
                error instanceof Error ?
                    error.message :
                    "Unable to execute code."
            );
        }
        finally {
            setRunning(false);
        }
    }

    const handleStop = () => {
        setRunning(false);
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        alert("Pasting is not allowed in the code editor.");
    }


    return (
        <div className="flex flex-col gap-4">

            <div className="flex items-center justify-between rounded-md bg-code-editor px-4 py-3">
                <select
                    value={language}
                    onChange={(element) => setLanguage(element.target.value)}
                    className="rounded-md border border-default-border  px-3 py-2 text-sm outline-none"
                >
                    {languages.map(lang => (
                        <option
                            key={lang.value}
                            value={lang.value}
                        >
                            {lang.label}
                        </option>
                    ))}
                </select>
                <div className={`flex items-center px-3 py-2 gap-2 rounded-md border transition-colors duration-300 cursor-pointer
                     ${running ? 
                        "hover:border-system-red hover:text-system-red" :
                        "text-default-text hover:bg-transparent hover:text-status-success hover:border-status-success"}`}>
                  
                    {running ? <Pause size={18}/> : <Play size={18}/> }
                    
                    <button
                        type="button"
                        onClick={running ? handleStop : handleRun}
                        className=" text-sm font-medium"
                    >
                        {running ? "Running..." : "Run"}
                    </button>
                </div>
                
            </div>

            <div onPaste={handlePaste} className="border border-default-border rounded-md overflow-hidden">
                <div className="h-100">
                    <Editor
                        height="100%"
                        language={language}
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
            </div>

            <div className="flex flex-col mt-4 border border-default-border text-default-text/95 bg-background rounded-md p-4">
                <div className="mb-2 text-sm font-staatliches">
                    Output
                </div>
                <pre className="flex-1 min-h-32 overflow-auto whitespace-pre-wrap text-sm">
                    {output || "Run your code to see the output."}
                </pre>
            </div>
        </div>
    )
}