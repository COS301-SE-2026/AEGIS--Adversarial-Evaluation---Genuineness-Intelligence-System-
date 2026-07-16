import { MCQOption, TestCase, QuestionType } from "./question-builder"

export interface QuestionBank {
    question_bank_id: number,
    title: string,
    content: string,
    type?: string,
    question_metadata?: unknown,
    maximum_score?: number,
    correct_answer?: string,
    tags?: string | string[],
    created_at?: string,
    updated_at?: string,
    category_id: number,
    difficulty: string
}

export interface QuestionCategory {
    category_id: number,
    category_name: string,
}

export interface QuestionPayload {
    title: string,
    category_id: number,
    difficulty: string,
    maximum_score?: number,
    type?: string,
    tags?: string[],
    content?: string,
    correct_answer?: string,
    question_metadata?: unknown //assuming its a json object
    starterCode?: string;
    options?: MCQOption[],
    testCases?: TestCase[],
    rubric?: string, // for the paragraph/comprehension questions
    expectedKeywords?: string[], // for comprehension
    blanks?: string[], // for the fill in blanks questions
    source_question_id: number | undefined,
    technique: string | undefined
    created_at?: string,
    updated_at?: string
}