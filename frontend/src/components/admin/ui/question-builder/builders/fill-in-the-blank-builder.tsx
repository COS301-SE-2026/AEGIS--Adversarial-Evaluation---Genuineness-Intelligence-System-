"use client";

import { Plus, Trash2 } from "lucide-react";
import { QuestionBuilderState } from "@/app/(admin)/types/question-builder";

type FillBlanksBuilderProps = Readonly <{
    question: QuestionBuilderState;
    update<K extends keyof QuestionBuilderState>(
        key: K,
        value: QuestionBuilderState[K]
    ) : void;
}>

export default function FillBlanksBuilder({question, update}: FillBlanksBuilderProps) {
    
    const updateBlank = (id: string, value: string) => {
       update("blanks", question.blanks.map(blank => blank.id === id ? {...blank, answer: value} : blank))
    };

    const removeBlank = (id: string) => {
        update("blanks", question.blanks.filter(blank => blank.id !== id ));
    };

    return (
        <div className="space-y-6">
            
            <div className="flex items-center justify-between">
                
                <div>
                    <h2 className="text-xl tracking-widest">
                        Accepted Answers
                    </h2>
                    <p className="text-sm text-default-border">
                        Add one acceptable answer for each blank space.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => update("blanks", [ ...question.blanks, {id: crypto.randomUUID(), answer:"",} ])}
                    className="flex items-center gap-2 rounded bg-system-red px-4 py-2 font-staatliches tracking-widest"
                >
                    <Plus size={16}/>
                    <span>Add Blank</span>
                </button>
            </div>

            <div className="space-y-4">
                {question.blanks.map((blank, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-4 rounded-lg border border-tertiary-surface bg-secondary-surface p-4"
                    >
                        <input
                            value={blank.id}
                            onChange={(element) => updateBlank(blank.id, element.target.value)}
                            placeholder={`Blank ${index + 1}`}
                            className="flex-1 rounded border border-default-border bg-background px-4 py-2 focus:border-system-red focus:outline-none"
                        />

                        <button
                            type="button"
                            onClick={() => removeBlank(blank.id)}
                            className="text-default-border hover:bg-system-red"
                        >
                            <Trash2 size={18}/>
                        </button>

                    </div>
                ))}
            </div>

        </div>
    )
}