import type { ReactNode } from "react";

export interface TopPerformer {
    candidate_name: string,
    score_percent: number;
}

export interface AIUsageRate {
    level: "LOW" | "MEDIUM" | "HIGH",
    percent: number;
}

export interface InfoCardRankingItem {
    name: string,
    value: number;
}

export type InfoCardIcon = "trophy" | "chart" | "users" | "clock" | "ai";

export type InfoCardProps = 
    |   {
            type: "metric";
            title: string;
            value: number | string;
            icon: InfoCardIcon;
        }
    |   {
            type: "duration";
            title: string;
            value: number
            icon: InfoCardIcon
        }
    |   {
            type: "percentage";
            title: string;
            value: number;
            label?: "LOW" | "MEDIUM" | "HIGH";
            icon: InfoCardIcon;
        }
    |   {
            type: "ranking";
            title: string;
            items: InfoCardRankingItem[];
            icon: InfoCardIcon;
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

export interface AnalyticsTableColumn<T> {
    key: string;
    header: string;
    render: (item: T) => ReactNode;
    className?: string;
}

export interface AnalyticsTableProps<T> {
    items: T[];
    columns: AnalyticsTableColumn<T>[];
    emptyMessage?: string;
}

export interface AssessmentCandidateResult {
    candidate_id: number;
    candidate_name: string;
    total_score_percent: number;
    status: "PASS" | "FAIL";
    ai_rating_percent: number;
}

export interface AssessmentCandidatesResponse {
    items: AssessmentCandidateResult[];
    total: number;
}