export interface Question {
    questionId: number;
    questionTitle: string;
    questionText: string;
    type: 'multiple-choice' | 'coding' | 'fill-in-the-blank';
    options: string[];
    correctAnswer: string;
    tags: string[];
    attempted: boolean;
}