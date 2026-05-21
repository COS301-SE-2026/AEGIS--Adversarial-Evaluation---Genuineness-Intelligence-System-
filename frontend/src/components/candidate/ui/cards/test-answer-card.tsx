import { useEffect, useState } from "react";
import { TestMultipleChoiceCard } from "./test-multiple-choice-card";
import { Question } from "./question.type";
import CodeEditorCard from "./test-code-editor-card";

type TestAnswerCardProps = {
    question: Question;
    value?: string;
    onChange?: (value: string) => void;
};

export function TestAnswerCard({ question, value, onChange }: TestAnswerCardProps) {
    const [code, setCode] = useState<string>(value ?? "");

    useEffect(() => {
        setCode(value ?? "");
    }, [question.questionId, value]);

    const answerComponents = {
        'multiple-choice': (
            <TestMultipleChoiceCard
                question={question}
                value={value}
                onChange={onChange}
            />
        ),
        'coding': (
            <CodeEditorCard
                code={code}
                setCode={(next) => {
                    const resolved = typeof next === "function" ? next(code) : next;
                    setCode(resolved);
                    onChange?.(resolved);
                }}
            />
        ),
        'fill-in-the-blank': null
    };

    const selectedComponent = answerComponents[question.type as keyof typeof answerComponents];
    
    const getHeaderTitle = () => {
        switch(question.type) {
            case 'multiple-choice':
                return 'Multiple Choice';
            case 'coding':
                return 'Code Editor';
            case 'fill-in-the-blank':
                return 'Fill in the Blanks';
            default:
                return 'Answer';
        }
    };

    return (
        <div className=" lg:w-2xl lg:mr-22">
            <div className="flex items-center justify-center 2xl:w-36 h-14 tracking-wider bg-code-editor border-b border-default-border p-4">
                <h3 className="text-sm uppercase text-default-text">{getHeaderTitle()}</h3>
            </div>
            <div className="bg-code-editor w-3xl h-168 p-4 rounded-md">
                {selectedComponent}
            </div>
        </div>
    )
}