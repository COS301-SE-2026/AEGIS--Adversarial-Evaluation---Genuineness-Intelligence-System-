"use client"

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiGet, ApiError } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { CandidateMetrics, CandidateAssessmentMetrics } from "@/app/(admin)/types/metrics";
import Button from "@/components/hero/ui/button";
import MetricsTable from "@/components/admin/ui/cards/metrics-table";

const GradeAssessmentMetricsPage = () => {
    const params = useParams<{id : string}>();
    const [metrics, setMetrics] = useState<CandidateMetrics[]>([]);
    const [behavioralSummary, setBehavioralSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    function fetchCandidateMetricsEffect() {
        let isMounted = true;

        async function performFetch() {
            try {
                setIsLoading(true);
                const data = await apiGet<CandidateAssessmentMetrics>(
                    `/api/v1/candidate-assessments/${params.id}/metrics`,
                    { headers: getAuthHeaders()}
                );

                if (isMounted) {
                    setMetrics(data.metrics);
                    setBehavioralSummary(data.behavioral_summary);
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

                <Button variant="solid" className="px-4 py-2 text-sm">
                    Back
                </Button>
            </div>
            <div className="mb-4 bg-secondary-surface rounded-lg border border-default-border p-6">
                <h2 className="font-staatliches text-lg tracking-[0.04em] text-default-text mb-2">
                    Behavioral Summary
                </h2>
                {behavioralSummary ? (
                    <p className="text-sm text-default-text/80">
                        {behavioralSummary}
                    </p>
                ) : (
                    <p className="text-sm text-default-text/60">
                        No behavioral summary has been generated for this
                        attempt yet.
                    </p>
                )}
            </div>
            <MetricsTable metrics={metrics} />
        </div>
    );
}

export default GradeAssessmentMetricsPage;