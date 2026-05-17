import { Question } from "./question.type";

export function CodeEditorCard({ question }: { question?: Question }) {
    return (
        <div className="bg-code-editor w-3xl h-168 p-4 rounded-md">
            <h2>Code Editor</h2>
            {question && <p className="text-xs text-gray-400 mt-2">Type: {question.type}</p>}
        </div>
    )
}