"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, ApiError } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { CandidateMetrics, CandidateAssessmentMetrics } from "@/app/(admin)/types/metrics";
import type {
    BehavioralSummary,
    MetricsTimelineResponse,
} from "@/app/(admin)/types/reporting-timeline";
import Button from "@/components/hero/ui/button";
import MetricsTable from "@/components/admin/ui/cards/metrics-table";
import MetricsRadar from "@/components/admin/ui/dashboard/assessment-metrics-radar";
import ReviewPriorityBadge from "@/components/admin/ui/dashboard/review-priority-badge";
import BehavioralSummaryPanel from "@/components/candidate/ui/cards/BehavioralSummaryPanel";
import SessionTimeline from "@/components/candidate/ui/cards/SessionTimeline";

const GradeAssessmentMetricsPage = () => {
    const router = useRouter();
    const params = useParams<{id : string}>();
    const [metrics, setMetrics] = useState<CandidateMetrics[]>([]);
    const [behavioralSummary, setBehavioralSummary] = useState<string | null>(null);
    const [timeline, setTimeline] = useState<MetricsTimelineResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    function fetchCandidateMetricsEffect() {
        let isMounted = true;

        async function performFetch() {
            try {
                setIsLoading(true);
                const [metricsData, summaryData, timelineData] = await Promise.all([
                    apiGet<CandidateAssessmentMetrics>(
                        `/api/v1/candidate-assessments/${params.id}/metrics`,
                        { headers: getAuthHeaders() }
                    ),
                    apiGet<BehavioralSummary>(
                        `/api/v1/candidate-assessments/${params.id}/behavioral-summary`,
                        { headers: getAuthHeaders() }
                    ),
                    apiGet<MetricsTimelineResponse>(
                        `/api/v1/candidate-assessments/${params.id}/metrics-timeline`,
                        { headers: getAuthHeaders() }
                    ),
                ]);

                if (isMounted) {
                    setMetrics(metricsData.metrics);
                    setBehavioralSummary(summaryData.summary);
                    setTimeline(timelineData);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    const message = err instanceof ApiError ? err.message: "Failed to fetch metrics."
                    setError(message);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        performFetch();

        function cleanupEffect() {
            isMounted = false;
        }
        return cleanupEffect;
    }

    useEffect(fetchCandidateMetricsEffect, [params.id]);

    if (isLoading) {
        return <p>Loading...</p>
    }

    if (error) {
        return <p>{error}</p>
    }

    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-4 pt-2">
                <h1 className="font-staatliches text-[30px] tracking-[0.06em] leading-none text-default-text">
                    Behavioural Metrics
                </h1>

                <Button variant="solid" className="px-4 py-2 text-sm" onClick={() => router.back()}>
                    Back
                </Button>
            </div>
            <div className="mb-4">
                <BehavioralSummaryPanel summary={behavioralSummary} />
            </div>
            <div className="mb-4">
                <ReviewPriorityBadge />
            </div>
            <MetricsRadar />
            {timeline && (
                <div className="mt-6">
                    <SessionTimeline timeline={timeline} />
                </div>
            )}
            <div className="mt-6">
                <MetricsTable metrics={metrics} />
            </div>
        </div>
    );
}

export default GradeAssessmentMetricsPage;