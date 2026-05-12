type Percentage = number;

export interface AssessmentCardProps {
    assessmentId: number;
    title: string;
    description: string;
    num_questions: number;
    attempts: number;
    success_rate: Percentage;
}