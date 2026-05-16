import { Question } from "./question.type";



export function TestDescriptionCard({ question }: {question: Question}) {
    return (
        <div>
            <div className="flex flex-col items-center bg-code-editor w-24 h-14 border-b p-4">
                    <h2>Description</h2>
            </div>
            <div className="bg-code-editor w-152.25 h-206 p-4 rounded-md">
                <div className="flex flex-row items-center gap-4 p-4">
                    <h1 className="text-2xl">{question.questionId}.</h1>
                    <h1 className="text-2xl">{question.questionTitle}</h1>
                    {question.attempted ? (
                        <div className="flex items-center gap-2 ml-30">
                            <p className="text-sm">Attempted</p>
                            <div className="w-2 h-2 rounded-full border border-green-500"></div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 ml-30">
                            <p className="text-sm">Not Attempted</p>
                            <div className="w-2 h-2 rounded-full border border-red-500"></div>
                        </div>
                    )}
                </div>
                <hr className="border-default-border/75" />
                <div className="p-4">
                    <p>{question.questionText}</p>
                </div>
            </div>
        </div>
        
    )
}