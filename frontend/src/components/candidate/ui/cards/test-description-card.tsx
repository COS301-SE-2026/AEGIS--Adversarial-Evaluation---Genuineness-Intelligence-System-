import { Question } from "./question.type";

export function TestDescriptionCard({ question }: {question: Question}) {
    return (
        <div>
            <div className="flex flex-col items-center bg-code-editor w-24 h-14 border-b p-4">
                    <h2>Description</h2>
            </div>
            <div className="flex-1 w-full max-w-xl min-h-175 bg-code-editor p-6 rounded-md">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between min-w-0">
                    
                    <h1 className="text-xl sm:text-2xl wrap-break-word flex-1 min-w-0">
                        {question.questionTitle}
                    </h1>

                </div>
                <hr className="border-default-border/75" />
                <div className="p-4 min-w-0">
                    <p className="whitespace-pre-wrap">
                        {question.questionContent}
                    </p>
                </div>
            </div>
        </div>
        
    )
}