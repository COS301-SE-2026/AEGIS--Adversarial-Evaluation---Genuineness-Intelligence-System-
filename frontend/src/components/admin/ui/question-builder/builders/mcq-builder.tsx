"use client"

import { Plus } from "lucide-react";
import { MCQOption, QuestionBuilderState } from "@/app/(admin)/types/question-builder";
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
    
    const updateOption = (updated: MCQOption) => {
        if(updated.isCorrect) {
            setCorrectAnswer(updated.id);
            return;
        }

        update("options", question.options.map((option) => 
                option.id === updated.id ? updated : option
            )
        );
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

                <button
                    type="button"
                    onClick={() => update("options", [
                            ...question.options, 
                            {
                                id: crypto.randomUUID(), 
                                text: "",
                                isCorrect: false,
                            },
                        ])
                    }
                    className="flex items-center gap-2 rounded bg-system-red px-4 py-2 font-staatliches tracking-widest transition-all duration-200 font-background cursor pointer"
                >
                    <Plus size={16}/>
                    <span>New Options</span>
                </button>
            </div>

            <div className="space-y-4">
                {question.options.map((option, index) => (
                    <MCQOptionCard
                        key={option.id}
                        option={option}
                        index={index}
                        disabled={question.options.length <= 2}
                        onDelete={() => update("options", question.options.filter((o) => o.id !== option.id))}
                        onChange={updateOption}
                    />
                ))}
            </div>
        </div>
    )
}

