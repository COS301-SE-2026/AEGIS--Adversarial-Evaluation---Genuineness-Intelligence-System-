export interface TopPerformer {
    candidate_name: string,
    score_percent: number;
}

export interface AIUsageRate {
    level: "LOW" | "MEDIUM" | "HIGH",
    percent: number;
}

export interface BarChartData {
    assessment_name: string,
    average_score_percent: number;
}

export interface DashboardSummaryProps {
    top_performers: TopPerformer[],
    total_assessments: number,
    ai_usage: AIUsageRate;
}

export interface AssessmentAnalyticsTableItems {
    assessment_id: number,
    name: string,
    average_score_percent: number,
    top_candidate_name: string
}

export interface AssessmentAnalyticsTable {
    items: AssessmentAnalyticsTableItems[]
    page: number,
    page_size: number
}