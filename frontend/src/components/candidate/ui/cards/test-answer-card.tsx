import { useMemo } from "react";
import { TestMultipleChoiceCard } from "./test-multiple-choice-card";
import { Question } from "./question.type";
import CodeEditorCard from "./test-code-editor-card";
import { TestFillInTheBlanksCard } from "./test-fill-in-the-blanks-card";

type TestAnswerCardProps = {
    question: Question;
    value?: string;
    onChange?: (value: string) => void;
    candidateAssessId?: string | null;
};

export function TestAnswerCard({ question, value, onChange, candidateAssessId }: TestAnswerCardProps) {
    const answerComponent = useMemo(() => {
        return {
            'multiple-choice': (
            <TestMultipleChoiceCard
                question={question}
                value={value}
                onChange={onChange}
            />
            ),
            'coding': (
            <CodeEditorCard
                code={value ?? ""}
                setCode={(next) => {
                    const resolved = typeof next === "function" ? next(value ?? "") : next;
                    onChange?.(resolved);
                }}
                questionId={question.questionId}
                candidateAssessId={candidateAssessId}
                questionTitle={question.questionTitle}
                functionSignature={question.functionSignature}
            />
            ),
            'fill-in-the-blank': (
            <TestFillInTheBlanksCard
            question={question}
            />
        ),
        } as const;
    }, [candidateAssessId, onChange, question, value]);

    const selectedComponent = answerComponent[question.type as keyof typeof answerComponent];
    
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