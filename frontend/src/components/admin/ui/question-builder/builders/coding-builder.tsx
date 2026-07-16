"use client"

import { Plus } from "lucide-react";
import TestCaseCard from '../test-case-card'
import EditorPanel from "@/components/admin/ui/input/editor-panel";
import { QuestionBuilderState } from "@/app/(admin)/types/question-builder";

type CodingBuilderProps = Readonly <{
    question: QuestionBuilderState;
    update<K extends keyof QuestionBuilderState>(
        key: K,
        value: QuestionBuilderState[K]
    ) : void;
}>

export default function CodingBuilder({question, update}: CodingBuilderProps) {
    
    return (
        <div className="rounded-lg border border-tertiary-surface">
            <div className="space-y-8">
                <EditorPanel
                    correctAnswer={question.starterCode}
                    setCorrectAnswer={(value) => update("starterCode", value)}
                />

                <div className="space-y-5">
                
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl tracking-widest">
                            Test Cases
                        </h2>
                        <button
                            type="button"
                            onClick={() => {
                                update("testCases", [
                                    ...question.testCases,
                                    {
                                        id: crypto.randomUUID(),
                                        input: "",
                                        expectedOutput: "",
                                        hidden: false
                                    },
                                ])
                            }}
                            className="flex items-center gap-2 rounded bg-system-red px-4 py-2 cursor-pointer"
                        >
                            <Plus size={16}/>
                            <h3>Add Test Case</h3>
                        </button>
                    </div>

                    <div className="space-y-5">

                        {question.testCases.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-default-border p-10 text-center text-default-border">
                                No test cases added yet.
                            </div>
                        ) :  (
                            question.testCases.map((testCase, index) => (
                                <TestCaseCard
                                    key={testCase.id}
                                    index={index}
                                    testCase={testCase}
                                    onDelete={() => {
                                        update("testCases", question.testCases.filter((tc) => tc.id !== testCase.id))
                                    }}
                                    onChange={(updated) => {
                                        update("testCases", question.testCases.map((tc) => tc.id === updated.id ? updated : tc))
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}