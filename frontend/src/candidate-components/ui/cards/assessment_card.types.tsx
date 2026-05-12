type Percentage = number;

export interface AssessmentCardProps {
    assessmentId: number;
    title: string;
    description: string;
    attempts: number;
    success_rate: Percentage;
}