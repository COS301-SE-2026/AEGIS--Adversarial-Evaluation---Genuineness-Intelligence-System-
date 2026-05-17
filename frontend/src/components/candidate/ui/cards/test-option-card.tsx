import { Question } from "./question.type";

export function TestOptionCard({question}: {question: Question}) {

    const options = question.options;

    return (
        <div className="w-lg h-12 bg-transparent border border-default-border rounded-md p-4 flex items-center gap-4">
            {options.map((option, index) => (
                <div key={index} className="w-auto h-4 bg-[#252729]">
                    <p className="text-xs text-default-text p-1">{option}</p>
                </div>
            ))}
        </div>
    )
}