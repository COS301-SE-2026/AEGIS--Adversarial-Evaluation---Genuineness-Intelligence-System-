"use client";

import { useEffect, useState, useMemo } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AssessmentCard } from "@/components/candidate/ui/cards/assesment-card";
import type { AssessmentCardProps } from "@/components/candidate/ui/cards/assessment-card.types";
import { apiGet } from "@/lib/apiClient";
import { getToken, isAuthenticated, getRole } from "@/lib/auth";
import { HelpCircle } from "lucide-react";
import PageHelpDrawer from "@/components/admin/ui/help/page-help-drawer";
import { PAGE_HELP_CONTENT } from "@/components/admin/ui/help/page-help-content";

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
        accessToken: session.access_token?? null,
        assessmentId: session.assessment.assessment_id,
        title: session.assessment.title,
        description: session.assessment.description ?? "No description provided.",
        durationMins: session.assessment.duration_mins,
        status: session.status === "STARTED" ? "Ready to start." : session.status,
        startTime: session.start_time ?? null,
        endTime: session.end_time ?? null,
    };
}

function getStoredAuthToken(): string | undefined {
    return getToken() ?? undefined;
}

function AssessmentPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [authChecked, setAuthChecked] = useState(false);
    const [assessments, setAssessments] = useState<AssessmentCardProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [helpOpen, setHelpOpen] = useState(false);
    const searchQuery = searchParams.get("search")?.toLowerCase() ?? "";

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


    const filteredAssessments = useMemo(() => {
        return assessments.filter((assessment) => {
            const titleMatches = assessment.title.toLowerCase().includes(searchQuery);
            const descMatches = assessment.description?.toLowerCase().includes(searchQuery);
            return titleMatches || descMatches;
        });
    }, [assessments, searchQuery]);

    if (!authChecked) {
        return (
            <main>
                <div className="pt-8 text-white-smoke">Checking access...</div>
            </main>
        );
    }



    return (
        <main className="min-h-screen px-8 py-8">
            <div className="mt-8 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl text-default-text mb-2">Available Assessments</h1>  
                    <p className="font-ibm-plex text-base text-white-smoke">
                        Start an assessment with carefully curated questions.
                    </p>
                </div>

                <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50">
                    <button
                        onClick={() => setHelpOpen(true)}
                        className="flex flex-col items-center text-system-red hover:text-default-text transition-all duration-200 group"
                        aria-label="Open FAQ"
                    >
                        <HelpCircle 
                            type="button"
                            strokeWidth={1.75}
                            className="w-8 h-8 sm:w-8 sm:h-8 lg:w-10 lg:h-10 group-hover:scale-110 transition-transform"
                        />
                        <span className="mt-1 text-11px sm:text-sm uppercase tracking-wider">
                            Help
                        </span>
                    </button>
                </div>
            </div>
            <PageHelpDrawer
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
                config={PAGE_HELP_CONTENT["/assessment"]}
            />
            {isLoading ? (
                <div className="pt-8 text-white-smoke">Loading assessments...</div>
            ) : error ? (
                <div className="pt-8 text-system-red">{error}</div>
            ) : assessments.length === 0 ? (
                <div className="pt-8 text-white-smoke">
                    No assessments assigned yet
                </div>
            ) : (
                <div className="grid grind-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-8 pb-8">
                    {filteredAssessments.map((assessment) => (
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

export default function AssessmentPage() {
    return (
        <main>
            <Suspense 
                fallback=
                {<div className="pt-8 text-default-text">
                    Loading View...
                </div>}
            >
                <AssessmentPageContent/>
            </Suspense>
        </main>
    )
}