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
                        <span className="mr-1.5">{question.questionId}.</span>
                        {question.questionTitle}
                    </h1>
                    <div className="flex items-center justify-between gap-3 rounded-lg p-3 shrink-0 w-full sm:w-auto sm:justify-start sm:px-4">
                        <p className="text-sm">
                            {question.attempted ? "Attempted" : "Not Attempted"}
                        </p>
                        <div className={`w-2 h-2 rounded-full border shrink-0 ${question.attempted ? "border-green-500" : "border-red-500"}`}/>
                    </div>

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