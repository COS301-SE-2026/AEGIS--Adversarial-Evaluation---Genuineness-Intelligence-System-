"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet, ApiError } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { ReviewPriorityResponse } from "@/app/(admin)/types/metrics";
import { QuestionAnalytics, QuestionAnalyticsResponse, REVIEW_BAND_META } from "@/app/(admin)/types/metrics";
import { QuestionNavigator } from "./question-navigator";
import { CandidateAnswerViewer } from "./candidate-answer-viewer";
import { ReviewScoreCard } from "./review-score-card";
import { TelemetryDashboard } from "./telemetry-dashboard";

const USE_MOCK_DATA = false;

async function fetchReviewPriority(assessmentId: string) {
  return apiGet<ReviewPriorityResponse>(
    `/api/v1/candidate-assessments/${assessmentId}/review-priority`,
    { headers: getAuthHeaders() },
  );
}

async function fetchQuestionAnalytics(assessmentId: string) {
  return apiGet<QuestionAnalyticsResponse>(`/api/v1/candidate-assessments/${assessmentId}/question-analytics`, { headers: getAuthHeaders() });
}

function renderContributingFactor(factor: string, index: number) {
  return <li key={`${factor}-${index}`}>{factor}</li>;
}

export function ReviewPriorityBadge() {
  const params = useParams<{ id: string }>();
  const [overallPriority, setOverallPriority] = useState<ReviewPriorityResponse | null>(null);
  const [questions, setQuestions] = useState<QuestionAnalytics[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processQuestions = (questions: QuestionAnalytics[]) => {
    setQuestions(questions);
    if (questions.length > 0) {
      setSelectedQuestionId(questions[0].assessment_q_id);
    }
  }

  const getErrorMessage = (err: unknown): string => {
    return err instanceof ApiError ? err.message : "Failed to load review priority.";
  }

  useEffect(function initializeReviewPriority() {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);

        const [priorityRes, analyticsRes] = await Promise.all([
          fetchReviewPriority(params.id),
          fetchQuestionAnalytics(params.id),
        ]);

        if (isMounted) {
          setOverallPriority(priorityRes);
          processQuestions(analyticsRes.questions);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return function cleanupReviewPriority() {
      isMounted = false;
    };
  }, [params.id]);

  const selectedQuestion = questions.find((q) => q.assessment_q_id === selectedQuestionId);


  if (isLoading) {
    return <p className="text-default-border p-4">Loading review metrics...</p>;
  }

  if (error) {
    return <p className="text-system-red p-4">{error}</p>;
  }

  if (!overallPriority) {
    return <p className="text-default-border p-4">No review priority data available.</p>;
  }

  const bandMeta = REVIEW_BAND_META[overallPriority.band];

  return (
    <div className="rounded-lg border border-default-border bg-secondary-surface overflow-hidden">

      <div className="border-b border-tertiary-surface p-6">
        <h2 className="text-xl tracking-widest text-default-text mb-6">
          Overall Review Priority
        </h2>

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-6xl font-bold text-default-text">
              {overallPriority.score}
            </span>
            <div 
              className="mt-6 inline-flex rounded-full px-6 py-2 text-md font-bold border" 
              style={{ 
                backgroundColor: `${bandMeta.color}15`, 
                color: bandMeta.color,
                borderColor: bandMeta.color
              }}
            >
              {bandMeta.label} Priority
            </div>
          </div>

          <div className=" border border-tertiary-surface rounded-md px-6 py-2 items-center text-center md:text-left">
            {overallPriority.contributing_factors.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text text-default-text">
                {overallPriority.contributing_factors.map(renderContributingFactor)}
              </ul>
            ) : (
              <p className="text-sm text-default-border">
                No contributing factors recorded
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-150">
          <QuestionNavigator
            questions={questions}
            selectedQuestionId={selectedQuestionId || questions[0]?.assessment_q_id}
            onSelectQuestion={setSelectedQuestionId}
          />

          <div className="flex-1 p-5 overflow-auto">
            {selectedQuestion ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg tracking-widest mb-2">
                    {selectedQuestion.title}
                  </h3>
                  <p className="text-sm text-default-border mb-4">
                    {selectedQuestion.content}
                  </p>
                </div>

                <CandidateAnswerViewer question={selectedQuestion}/>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ReviewScoreCard question={selectedQuestion}/>
                  <div className="bg-background border border-tertiary-surface rounded-lg p-4">
                    <h4 className="tracking-widest text-default-text mb-4">
                      Behavioral Telemetry
                    </h4>
                    <TelemetryDashboard metrics={selectedQuestion.metrics}/>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-default-border">Select a question to view details.</p>
            )}
          </div>
      </div>

    </div>
  );
}

export default ReviewPriorityBadge;