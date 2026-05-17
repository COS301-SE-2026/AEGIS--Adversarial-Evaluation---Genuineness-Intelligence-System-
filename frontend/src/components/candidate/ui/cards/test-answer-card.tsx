import { TestOptionCard } from "./test-option-card";
import { Question } from "./question.type";
import { CodeEditorCard } from "./test-code-editor-card";

export function TestAnswerCard({ question }: { question: Question }) {
    return (
        <div>
            <div className="flex flex-col items-center bg-code-editor w-48 h-14 border-b p-4">
                {question.type === 'multiple-choice' ? 
                
                <div><h2>Multiple Choice</h2></div> 
                : 
                <div><h2> Code Editor</h2></div>}
            </div>
            <div className="bg-code-editor w-3xl h-168 p-4 rounded-md">
                {question.type === 'multiple-choice' ? <TestOptionCard question={question} /> : <CodeEditorCard question={question}/>}
            </div>
        </div>
    )
}