"use client";

import { useParams } from "next/navigation";
import { InfoCard } from "@/components/candidate/ui/cards/report-info-card";
import { AssessmentCandidateTableContainer } from "@/components/admin/ui/dashboard/assessment-candidate-table-container";
import { useAssessmentDetails } from "@/hooks/dashboard-assessment-details-hook";
import { useAssessmentCandidate } from "@/hooks/dashboard-assessment-candidates-hook";
import { FileQuestion } from "lucide-react";
import { ApiError } from "@/lib/apiClient";
import Button from "@/components/hero/ui/button";


export default function AssessmentPage() {
  const params = useParams<{ assessment_id: string }>();
  const assessmentId = Number(params.assessment_id);
  
  const { data, isLoading, isError, error } =
    useAssessmentDetails(assessmentId);

  const { data: candidatesData } = useAssessmentCandidate(assessmentId);

  const integrityScores = (candidatesData?.items ?? [])
    .map((candidate) => candidate.integrity_score)
    .filter((score): score is number => score !== null);

  const averageIntegrityScore =
    integrityScores.length > 0
      ? Math.round(
          integrityScores.reduce((sum, score) => sum + score, 0) /
            integrityScores.length,
        )
      : null;

  if (isLoading) {
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-lg bg-secondary-surface"
          />
        ))}
      </section>
    );
  }

  if (isError) {
    const assessmentNotFound =
      error instanceof ApiError && error.status === 404;

    let errorMessage: string;

    if (assessmentNotFound) {
      errorMessage =
        "This assessment may have been deleted or the link may be invalid.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = "Something went wrong while loading this assessment.";
    }

    return (
      <section className="mt-6 flex min-h-96 items-center justify-center px-4">
        <div className="flex w-full max-w-xl flex-col items-center border border-default-border bg-secondary-surface px-6 py-12 text-center">
          <FileQuestion className="mb-5 h-12 w-12 text-system-red" />

          <h1 className="font-staatliches text-2xl tracking-widest text-default-text">
            {assessmentNotFound
              ? "ASSESSMENT NOT FOUND"
              : "UNABLE TO LOAD ASSESSMENT"}
          </h1>

          <p className="mt-3 max-w-md text-sm text-default-border">
            {errorMessage}
          </p>

          <Button
            variant="solid"
            onClick={() => window.history.back()}
            className="mt-8 px-10 py-3"
          >
            Go Back
          </Button>
        </div>
      </section>
    );
  }
  if (!data) {
    return null;
  }

  return (
    <section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <InfoCard
          type="ranking"
          title="Top Performers" 
          items={data.top_performers.map((candidate) => ({
            name: candidate.candidate_name,
            value: candidate.score_percent,
          }))} 
          icon="trophy"
        />
        
        <InfoCard 
          type="duration"
          title="Average Completion Time" 
          value={data.average_completion_time} 
          icon="chart"
        />
          
        <InfoCard 
          type="percentage"
          title="Assessment Average"
          value={data.average_total_percent}
          icon="chart"
        />

        <InfoCard
          type="metric"
          title="Average Integrity Score"
          value={averageIntegrityScore === null ? "—" : averageIntegrityScore}
          icon="ai"
        />
      </div>

      <div className="flex flex-col justify-between gap-12 rounded-xl mt-8">

        <div className="mb-4">
          <AssessmentCandidateTableContainer assessmentId={assessmentId}/>
        </div>

      </div>
    </section>
  );
}
