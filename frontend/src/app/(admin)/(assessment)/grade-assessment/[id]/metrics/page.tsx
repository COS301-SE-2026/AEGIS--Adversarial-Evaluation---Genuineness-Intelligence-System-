"use client"

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiGet, ApiError } from "@/lib/apiClient";
import { CandidateMetrics } from "@/app/(admin)/types/metrics";
import MetricsTable from "@/components/admin/ui/cards/metrics-table";

const GradeAssessmentMetricsPage = () => {
    const params = useParams<{id : string}>();
    const [metrics, setMetrics] = useState<CandidateMetrics[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    function fetchCandidateMetricsEffect() {
        let isMounted = true;

        async function performFetch() {
            try {
                setIsLoading(true);
                const data = await apiGet<CandidateMetrics[]>(
                    `/api/v1/candidate-assessments/${params.id}/metrics`
                );

                if (isMounted) {
                    setMetrics(data);
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
            <h1>Behavioural Metrics</h1>
            <MetricsTable metrics={metrics} />
        </div>
    );
}

export default GradeAssessmentMetricsPage;