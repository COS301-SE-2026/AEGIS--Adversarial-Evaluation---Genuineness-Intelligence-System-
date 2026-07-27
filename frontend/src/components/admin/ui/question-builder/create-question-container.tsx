"use client"

import { useMemo, useState } from "react";
import { defaultQuestionState, QuestionBuilderState, QuestionType } from "@/app/(admin)/types/question-builder";
import { QuestionCategory, QuestionPayload } from "@/app/(admin)/types/questions";

import QuestionTypeModal from "./question-type-modal";
import QuestionBuilderDrawer from "./question-builder-drawer";
import UniversalFields from "./universal-fields";

import CodingBuilder from "./builders/coding-builder";
import MCQBuilder from "./builders/mcq-builder";
import ComprehensionBuilder from "./builders/comprehension-builder";
import FillBlanksBuilder from "./builders/fill-in-the-blank-builder";

interface CreateQuestionContainerProps {
    open: boolean;
    categories: QuestionCategory[];
    onClose: () => void;
    onSubmit: (payload: QuestionPayload) => void;
    isSaving?: boolean;
}

export default function CreateQuestionContainer({open, categories, onClose, onSubmit, isSaving = false}:CreateQuestionContainerProps) {
    
    const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
    const [question, setQuestion] = useState<QuestionBuilderState>(defaultQuestionState);

    //this replaces the old way of setTile, setTags, setDifficulty and so on.
    function update<K extends keyof QuestionBuilderState>(key: K, value: QuestionBuilderState[K]) {
        setQuestion((previous) => ({
            ...previous,
            [key]: value
        }))
    }

    function handleSelectedType(type: QuestionType) {
        setSelectedType(type);
        setQuestion({...defaultQuestionState, type});
    }

    const handleClose = () => {
        setSelectedType(null);
        setQuestion(defaultQuestionState);
        onClose();
    }

    const builder = useMemo(() => {
        switch(question.type) {
            
            case "CODING":
                return (
                    <CodingBuilder
                        question={question}
                        update={update}
                    />
                );

            case "MCQ":
                return (
                    <MCQBuilder
                        question={question}
                        update={update}
                    />
                );
            
            case "COMPREHENSION":
                return (
                    <ComprehensionBuilder
                        question={question}
                        update={update}
                    />
                );

            case "FILL_BLANKS":
                return (
                    <FillBlanksBuilder
                        question={question}
                        update={update}
                    />
                );

            default:
                return null;
        }
    }, [question]);

    // The generic payload only carries the universal fields (title, category, difficulty, etc). Each question type also needs its own shape mapped in.
    function buildTypeSpecificPayload(question: QuestionBuilderState): Partial<QuestionPayload> {
    switch (question.type) {
        case "CODING":
            return {
                starterCode: question.starterCode,
                testCases: question.testCases,
            };
        case "MCQ":
            return {
                options: question.options,
            };
        case "COMPREHENSION":
            return {
                rubric: question.rubric,
                expectedKeywords: question.expectedKeywords,
            };
        case "FILL_BLANKS":
            return {
                // preserves appearance order (A, B, C, ...) so it lines up with the [A][B][C] markers on the backend.
                blanks: question.blanks.map((blank) => blank.answer),
            };
        default:
            return {};
    }
}

    function handleSave() {
        
        const payload: QuestionPayload = {
            
            title: question.title,
            category_id: question.category_id,
            content: question.content,
            difficulty: question.difficulty,
            maximum_score: question.maximum_score,
            tags: question.tags,
            type: question.type,
            correct_answer: "",
            source_question_id: -1,
            technique: "",
            ...buildTypeSpecificPayload(question), 
        };

        onSubmit(payload);
    }

    return (
        <>
            <QuestionTypeModal
                open={open && selectedType === null}
                onClose={handleClose}
                onSelect={handleSelectedType}
            />

            <QuestionBuilderDrawer
                open={open && selectedType !== null}
                title="Create Question"
                onClose={handleClose}
                onSave={handleSave}
                isSaving={isSaving}
            >
                <div className="space-y-10">
                    <UniversalFields
                        question={question}
                        categories={categories}
                        update={update}
                    />

                    {builder}
                </div>
            </QuestionBuilderDrawer>
        </>
    )
}