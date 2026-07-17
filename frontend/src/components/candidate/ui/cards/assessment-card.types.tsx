export interface AssessmentCardProps {
    candidateAssessId: number;
    accessToken: string | null;
    assessmentId: number;
    title: string;
    description: string;
    durationMins: number;
    status: string;
    startTime?: string | null;
    endTime?: string | null;
}