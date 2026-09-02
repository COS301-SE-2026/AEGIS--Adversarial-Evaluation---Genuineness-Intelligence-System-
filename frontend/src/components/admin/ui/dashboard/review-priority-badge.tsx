"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";
import { useParams } from "next/navigation";
import { apiGet, ApiError } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { ReviewBand, ReviewPriorityResponse } from "@/app/(admin)/types/metrics";

type ReviewBandMeta = {
  label: string;
  color: string;
};

const REVIEW_BAND_META: Record<ReviewBand, ReviewBandMeta> = {
  low: {
    label: "Low",
    color: "var(--color-status-success, #4ade80)",
  },
  medium: {
    label: "Medium",
    color: "var(--color-warning, #fbbf24)",
  },
  high: {
    label: "High",
    color: "var(--color-system-red, #ef4444)",
  },
};

function clampScore(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function getBandData(score: number, band: ReviewBand) {
  const safeScore = clampScore(score);

  return {
    value: safeScore,
    fill: REVIEW_BAND_META[band].color,
  };
}

function createReviewPriorityData(response: ReviewPriorityResponse) {
  return [getBandData(response.score, response.band)];
}

async function fetchReviewPriority(assessmentId: string) {
  return apiGet<ReviewPriorityResponse>(
    `/api/v1/candidate-assessments/${assessmentId}/review-priority`,
    { headers: getAuthHeaders() },
  );
}

function renderContributingFactor(factor: string, index: number) {
  return <li key={`${factor}-${index}`}>{factor}</li>;
}

export function ReviewPriorityBadge() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ReviewPriorityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(function initializeReviewPriority() {
    let isMounted = true;

    async function loadReviewPriority() {
      try {
        const response = await fetchReviewPriority(params.id);

        if (isMounted) {
          setData(response);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof ApiError
              ? err.message
              : "Failed to load review priority.";

          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReviewPriority();

    return function cleanupReviewPriority() {
      isMounted = false;
    };
  }, [params.id]);

  const chartData = useMemo(function computeReviewPriorityData() {
    if (!data) {
      return [];
    }

    return createReviewPriorityData(data);
  }, [data]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!data) {
    return <p>No review priority data available.</p>;
  }

  const bandMeta = REVIEW_BAND_META[data.band];
  const score = clampScore(data.score);

  return (
    <div className="rounded-lg border border-default-border bg-secondary-surface p-4">
      <div className="mb-4">
        <h2 className="font-staatliches text-xl tracking-[0.06em] text-default-text">
          Review Priority
        </h2>
      </div>

      <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
        <div className="h-40 w-44">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={chartData}
              cx="50%"
              cy="100%"
              innerRadius="60%"
              outerRadius="100%"
              startAngle={180}
              endAngle={0}
              barSize={20}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
                fill={bandMeta.color}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col items-center md:items-start">
          <div className="text-sm uppercase tracking-[0.08em] text-default-text/70">
            Signal strength
          </div>
          <div className="mt-1 text-4xl font-staatliches tracking-[0.08em] text-default-text">
            {score}
          </div>
          <div
            className="mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${bandMeta.color}22`,
              color: bandMeta.color,
            }}
          >
            {bandMeta.label}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm uppercase tracking-[0.08em] text-default-text/70">
          Observed patterns
        </h3>

        {data.contributing_factors.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-default-text/80">
            {data.contributing_factors.map(renderContributingFactor)}
          </ul>
        ) : (
          <p className="text-sm text-default-text/70">
            No contributing factors recorded
          </p>
        )}
      </div>
    </div>
  );
}

export default ReviewPriorityBadge;