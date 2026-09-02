"use client";

import { QuestionQualityDonut } from "./question-quality-donut";
import { useQuestionQuality } from "@/hooks/use-reporting";

export function QuestionQualityContainer() {
  const { data, isLoading, isError, error } = useQuestionQuality();

  if (isLoading) {
    return <div className="h-80 w-full animate-pulse rounded-lg bg-background/30" />;
  }

  if (isError) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-system-red">
        <p className="text-sm text-system-red">
          {error instanceof Error ? error.message : "Failed to load question quality data."}
        </p>
      </div>
    );
  }

  if (!data || data.total_questions_answered === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center text-center rounded-lg border border-default-border bg-secondary-surface">
        <p className="text-sm text-default-text">No question quality data available</p>
        <p className="mt-1 text-xs text-default-border">
          Data will appear once candidates start answering questions.
        </p>
      </div>
    );
  }

  return <QuestionQualityDonut data={data} />;
}