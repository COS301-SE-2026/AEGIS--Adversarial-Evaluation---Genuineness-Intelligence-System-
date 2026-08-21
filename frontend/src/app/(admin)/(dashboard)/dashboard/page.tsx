"use client"

import { InfoCard } from "@/components/candidate/ui/cards/report-info-card";
import { AssessmentBarChartContainer } from "@/components/admin/ui/dashboard/assessment-bar-chart-container";
import { AssessmentAnalyticsTableContainer } from "@/components/admin/ui/dashboard/assessment-analytics-table-container";
import { useDashboardSummary } from "@/hooks/dashboard-summary-hook";
import { useEffect, useState } from "react";
import { getUserId } from "@/lib/auth";

export default function DashboardPage() {
  const [recruiterId, setRecruiterId] = useState<number | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setRecruiterId(getUserId());
    setAuthReady(true);
  }, []);
  const { data, isLoading, isError, error } = useDashboardSummary(recruiterId);

  if (!authReady || isLoading) {
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-32 animate-pulse rounded-lg bg-secondary-surface" />
        <div className="h-32 animate-pulse rounded-lg bg-secondary-surface" />
        <div className="h-32 animate-pulse rounded-lg bg-secondary-surface" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="border border-system-red p-6">
        <p className="text-sm text-system-red">
          {error instanceof Error
            ? error.message
            : "Failed to load dashboard summary."}
        </p>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        
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
          type="metric"
          title="Total Assessments" 
          value={data.total_assessments} 
          icon="chart"
        />

        <InfoCard 
          type="percentage"
          title="AI Usage Rate"
          value={data.ai_usage_rate.percent}
          label={data.ai_usage_rate.level}
          icon="ai"
        />

      </div>

      <div className="flex flex-col justify-between gap-4 rounded-xl mt-2">

        <div className="mb-8">
          <AssessmentBarChartContainer/>
        </div>

        <div className="mb-4">
          <AssessmentAnalyticsTableContainer/>
        </div>

      </div>

    </section>
  );
}
