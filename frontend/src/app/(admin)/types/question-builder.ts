export type QuestionType = "CODING" | "MCQ" | "COMPREHENSION" | "FILL_BLANKS";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface MCQOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface FillBlank {
    id: string;
    answer: string;
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
    functionSignature: string;
    starterCode: string;
    options: MCQOption[];
    rubric: string;
    expectedKeywords: string[];
    blanks: FillBlank[];
    testCases: TestCase[];
}

export const createDefaultTestCase = (): TestCase => ({
    id: crypto.randomUUID(),
    input: "",
    expectedOutput: "",
    hidden: false,
})

export const createDefaultMCQQuestion = (isCorrect = false): MCQOption => ({
    id: crypto.randomUUID(),
    text: "",
    isCorrect,
})

export const defaultQuestionState: QuestionBuilderState = {
    type: "CODING",
    title: "",
    content: "",
    category_id: 0,
    difficulty: "Easy",
    maximum_score: 10,
    tags: [],
    functionSignature: "",
    starterCode: `def solve(nums, target):
    # Add the function body here.`,
    options: [
        createDefaultMCQQuestion(true),
        createDefaultMCQQuestion(false),
    ],
    rubric: "",
    expectedKeywords: [],
    blanks: [],
    testCases: [],
}

