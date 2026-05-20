import { Question } from "./question.type";

export function TestDescriptionCard({ question }: {question: Question}) {
    return (
        <div>
            <div className="flex flex-col items-center bg-code-editor w-18 2xl:w-24 2xl:h-14 border-b p-4">
                    <h2>Description</h2>
            </div>
            <div className="bg-code-editor h-120 rounded-md">
                <div className="flex flex-row items-center gap-4 p-4">
                    <h1 className="text-2xl">{question.questionId}.</h1>
                    <h1 className="text-2xl">{question.questionTitle}</h1>
                    {question.attempted ? (
                        <div className="flex items-center gap-2 ml-70">
                            <p className="text-sm">Attempted</p>
                            <div className="w-2 h-2 rounded-full border border-green-500"></div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 ml-70">
                            <p className="text-sm">Not Attempted</p>
                            <div className="w-2 h-2 rounded-full border border-red-500"></div>
                        </div>
                    )}
                </div>
                <hr className="border-default-border/75" />
                <div className="p-4">
                    <p className="whitespace-pre-wrap">{question.questionContent}</p>
                </div>
            </div>
        </div>
        
    )
}