export type QuestionType = "CODING" | "MCQ" | "COMPREHENSION" | "FILL_BLANKS";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface MCQOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface TestCase {
    id: string;
    input: string;
    expectedOutput: string;
    hidden: boolean;
}

export interface QuestionBuilderState {
    type: QuestionType;
    title: string;
    content: string;
    category_id: number;
    difficulty: Difficulty
    maximum_score: number;
    tags: string[];
    starterCode: string;
    options: MCQOption[];
    rubric: string;
    expectedKeywords: string[];
    blanks: string[];
    testCases: TestCase[];
}

export const defaultQuestionState: QuestionBuilderState = {
    type: "CODING",
    title: "",
    content: "",
    category_id: 0,
    difficulty: "EASY",
    maximum_score: 10,
    tags: [],
    starterCode: "",
    options: [],
    rubric: "",
    expectedKeywords: [],
    blanks: [],
    testCases: [],
}