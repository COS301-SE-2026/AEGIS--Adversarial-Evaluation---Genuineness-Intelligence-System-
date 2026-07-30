"use client"

import { useMemo, useState } from "react";
import { defaultQuestionState, FILL_BLANKS_PLACEHOLDER_TEMPLATE, QuestionBuilderState, QuestionType } from "@/app/(admin)/types/question-builder";
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
    onSubmit: (payload: QuestionPayload) => void | Promise<void>;
    isSaving?: boolean;
}

export default function CreateQuestionContainer({open, categories, onClose, onSubmit, isSaving = false}:CreateQuestionContainerProps) {
    
    const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
    const [question, setQuestion] = useState<QuestionBuilderState>(defaultQuestionState);
    const [submitError, setSubmitError] = useState<string | null>(null);

    //this replaces the old way of setTile, setTags, setDifficulty and so on.
    function update<K extends keyof QuestionBuilderState>(key: K, value: QuestionBuilderState[K]) {
        setQuestion((previous) => ({
            ...previous,
            [key]: value
        }))
    }

    function handleSelectedType(type: QuestionType) {
        setSubmitError(null);
        setSelectedType(type);
        setQuestion({
    ...defaultQuestionState,
    type,
    content: type === "FILL_BLANKS" ? FILL_BLANKS_PLACEHOLDER_TEMPLATE : defaultQuestionState.content,
        });
    }

    const handleClose = () => {
        setSubmitError(null);
        setSelectedType(null);
        setQuestion(defaultQuestionState);
        onClose();
    }

    function validateQuestionBuilderState(currentQuestion: QuestionBuilderState): string | null {
        const missingFields: string[] = [];

        if (!currentQuestion.title.trim()) {
            missingFields.push("question title");
        }

        if (!currentQuestion.content.trim()) {
            missingFields.push("question description");
        }

        if (!currentQuestion.category_id) {
            missingFields.push("category");
        }

        if (!currentQuestion.maximum_score || currentQuestion.maximum_score <= 0) {
            missingFields.push("score allocation");
        }

        switch (currentQuestion.type) {
            case "CODING":
                if (!currentQuestion.functionSignature.trim()) {
                    missingFields.push("function signature");
                }
                break;

            case "MCQ":
                if (currentQuestion.options.some((option) => !option.text.trim())) {
                    missingFields.push("all MCQ options");
                }

                if (!currentQuestion.options.some((option) => option.isCorrect)) {
                    missingFields.push("one correct MCQ answer");
                }
                break;

            case "FILL_BLANKS":
                if (currentQuestion.blanks.length === 0) {
                    missingFields.push("at least one blank");
                }

                if (currentQuestion.blanks.some((blank) => !blank.answer.trim())) {
                    missingFields.push("all blank answers");
                }
                break;

            default:
                break;
        }

        if (missingFields.length === 0) {
            return null;
        }

        const uniqueFields = Array.from(new Set(missingFields));
        return `Please fill out the required fields before saving: ${uniqueFields.join(", ")}.`;
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
                // preserves appearance order (A, B, C, ...) so it lines up with the backend markers.
                blanks: question.blanks.map((blank) => blank.id),
                correct_answer: {
                    answer: question.blanks.reduce((accumulator, blank) => {
                        accumulator[blank.id] = blank.answer;
                        return accumulator;
                    }, {} as Record<string, string>),
                },
            };
        default:
            return {};
    }
}

    async function handleSave() {
        const validationMessage = validateQuestionBuilderState(question);

        if (validationMessage) {
            setSubmitError(validationMessage);
            return;
        }

        setSubmitError(null);

        const codingMetadata = question.type === "CODING"
            ? {
                function_signature: question.functionSignature.trim(),
            }
            : undefined;
        
        const payload: QuestionPayload = {
            
            title: question.title,
            category_id: question.category_id,
            content: question.content,
            difficulty: question.difficulty,
            maximum_score: question.maximum_score,
            tags: question.tags,
            type: question.type === "FILL_BLANKS" ? "FILL_IN_THE_BLANK" : question.type,
            correct_answer:
                question.type === "CODING"
                    ? question.starterCode
                    : question.type === "FILL_BLANKS"
                        ? {
                            answer: question.blanks.reduce((accumulator, blank) => {
                                accumulator[blank.id] = blank.answer;
                                return accumulator;
                            }, {} as Record<string, string>),
                        }
                        : "",
            question_metadata: codingMetadata,
            testCases: question.type === "CODING" ? question.testCases : undefined,
            source_question_id: -1,
            technique: "",
            ...buildTypeSpecificPayload(question), 
        };

        await Promise.resolve(onSubmit(payload));
        handleClose();
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
                    {submitError && (
                        <div className="rounded border border-system-red/40 bg-system-red/10 px-4 py-3 text-sm text-system-red">
                            {submitError}
                        </div>
                    )}

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