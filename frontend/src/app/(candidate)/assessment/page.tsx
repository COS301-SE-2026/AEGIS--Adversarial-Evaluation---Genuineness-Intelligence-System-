"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AssessmentCard } from "@/components/candidate/ui/cards/assesment-card";
import type { AssessmentCardProps } from "@/components/candidate/ui/cards/assessment-card.types";
import { apiGet } from "@/lib/apiClient";
import { getToken, isAuthenticated, getRole } from "@/lib/auth";

type CandidateAssessmentApi = {
    candidate_assess_id: number;
    status: string;
    access_token?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    assessment: {
        assessment_id: number;
        title: string;
        description?: string | null;
        duration_mins: number;
    } | null;
};

function mapCandidateAssessment(session: CandidateAssessmentApi): AssessmentCardProps | null {
    if (!session.assessment) {
        return null;
    }

    return {
        candidateAssessId: session.candidate_assess_id,
        assessmentId: session.assessment.assessment_id,
        title: session.assessment.title,
        description: session.assessment.description ?? "No description provided.",
        durationMins: session.assessment.duration_mins,
        status: 'READY TO START',
        startTime: session.start_time ?? null,
        endTime: session.end_time ?? null,
    };
}

function getStoredAuthToken(): string | undefined {
    return getToken() ?? undefined;
}

export default function AssessmentPage() {
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);
    const [assessments, setAssessments] = useState<AssessmentCardProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            if (!isAuthenticated() || getRole() !== "CANDIDATE") {
                router.replace("/login");
                return;
            }
            setAuthChecked(true);
        };
        checkAuth();
    }, [router]);

    useEffect(() => {
        if (!authChecked) return;

        let isMounted = true;

        const loadAssessments = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const authToken = getStoredAuthToken();
                const sessions = await apiGet<CandidateAssessmentApi[]>(
                    "/api/v1/assessments/my-assessments",
                    authToken ? { authToken } : {}
                );

                const mapped = sessions
                    .map(mapCandidateAssessment)
                    .filter((item): item is AssessmentCardProps => item !== null);

                if (isMounted) {
                    setAssessments(mapped);
                }
            } catch (err) {
                const message = err instanceof Error
                    ? err.message
                    : "Unable to load assessments.";
                if (isMounted) {
                    setError(message);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadAssessments();

        return () => {
            isMounted = false;
        };
    }, [authChecked]);

    if (!authChecked) {
        return (
            <main>
                <div className="pt-8 text-white-smoke">Checking access...</div>
            </main>
        );
    }

    return (
        <main>
            <div className="mt-8">
                <h1 className="font-staatliches text-3xl text-default-text mb-2">Available Assessments</h1>
                <div>
                    <p className="font-ibm-plex text-base text-white-smoke">
                        Start an assessment with carefully curated questions.
                    </p>
                </div>
            </div>
            {isLoading ? (
                <div className="pt-8 text-white-smoke">Loading assessments...</div>
            ) : error ? (
                <div className="pt-8 text-system-red">{error}</div>
            ) : assessments.length === 0 ? (
                <div className="pt-8 text-white-smoke">
                    No assessments assigned yet.
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-x-32 gap-y-16 pt-8 pb-8">
                    {assessments.map((assessment) => (
                        <AssessmentCard
                            key={assessment.candidateAssessId}
                            {...assessment}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
