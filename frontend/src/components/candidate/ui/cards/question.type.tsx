export interface Question {
    questionId: number;
    questionTitle: string;
    questionContent: string;
    type: 'multiple-choice' | 'coding' | 'fill-in-blank';
    options: string[];
    correctAnswer: string | string[];
    tags: string[];
    attempted: boolean;
}