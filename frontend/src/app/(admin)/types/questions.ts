export interface QuestionBank {
    question_bank_id: number,
    title: string,
    content: string,
    type?: string,
    question_metadata?: string | string[],
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
    created_at?: string,
    updated_at?: string
    source_question_id?: number | null,
    technique?: string,
    adv_question_id?: number
}