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
    tags?: string[],
    content?: string,
    correct_answer?: string,
    created_at?: string,
    updated_at?: string
}

export const Mock_Questions: QuestionBank[] = [
    {
        question_bank_id: 1,
        title: "Two Sum",
        content: "Find two numbers that add up to a target in an array",
        question_metadata: "Python",
        tags: ["Array", "Hash Table"],
        category_id: 1,
        difficulty: "Easy"
    },
    {
        question_bank_id: 2,
        title: "Add Two Numbers",
        content: "Add two numbers represented as linked lists in reverse order",
        question_metadata: "Python",
        tags: ["Linked List", "Math"],
        category_id: 2,
        difficulty: "Medium"
    },
]

export const Question_Categories: QuestionCategory[] = [
    {
        category_id: 1,
        category_name: "Algorithms"
    },
    {
        category_id: 2,
        category_name: "Reasoning"
    },
    {
        category_id: 3,
        category_name: "Trees"
    }
]