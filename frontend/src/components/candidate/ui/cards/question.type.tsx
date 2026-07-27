export interface Question {
    questionId: number;
    questionTitle: string;
    questionContent: string;
    type: 'multiple-choice' | 'coding' | 'fill-in-the-blank';
    functionSignature?: string;
    options: string[];
    correctAnswer: string | string[];
    tags: string[];
    attempted: boolean;
}