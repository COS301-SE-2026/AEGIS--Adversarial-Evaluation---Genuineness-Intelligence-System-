"use client"

import { QuestionBuilderState } from "@/app/(admin)/types/question-builder";
import MCQOptionCard from "../mcq-option-card";

type MCQBuilderProps = Readonly <{
    question: QuestionBuilderState;
    update<K extends keyof QuestionBuilderState>(
        key: K,
        value: QuestionBuilderState[K]
    ) : void;
}>

export default function MCQBuilder({question, update}: MCQBuilderProps) {
    const setCorrectAnswer = (selectedId: string) => {
        update("options", question.options.map((option) => ({...option, isCorrect: option.id === selectedId})));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                
                <div>
                    <h2 className="text-xl tracking-widest">
                        Answer Options
                    </h2>
                    <p className="text-sm text-default-border">
                        Select the correct answer using the radio button
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {question.options.map((option, index) => (
                    <MCQOptionCard
                        key={option.id}
                        option={option}
                        index={index}
                        onSelect={() => setCorrectAnswer(option.id)}
                        onChange={(text) => update("options", question.options.map((currentOption) => (
                            currentOption.id === option.id
                                ? { ...currentOption, text }
                                : currentOption
                        )))}
                    />
                ))}
            </div>
        </div>
    )
}

