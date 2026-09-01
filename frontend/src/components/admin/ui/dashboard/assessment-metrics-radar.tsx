"use client"

import { useEffect, useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useParams } from "next/navigation";
import { apiGet, ApiError } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { MetricsRadarResponse, RadarAxisName } from "@/app/(admin)/types/metrics";

const AXIS_LABELS: Record<RadarAxisName, string> = {
  paste_ratio: "Paste Ratio",
  backspace_rate: "Backspace Rate",
  typing_speed: "Typing Speed",
  focus_loss_rate: "Focus Loss Rate",
};

function buildChartData(response: MetricsRadarResponse) {
  return response.axes.map((axis) => ({
    label: AXIS_LABELS[axis.axis],
    candidate: axis.candidate_value,
    cohort: axis.cohort_avg_value,
  }));
}

function formatTooltipValue(value: unknown) {
  const numericValue = Array.isArray(value) ? Number(value[0]) : Number(value);
  return [numericValue.toFixed(2), "Value"];
}

const MetricsRadar = ()=> {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<MetricsRadarResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{
    let isMounted = true;

    async function loadMetricsRadar() {
      try{
        setIsLoading(true);

        const response = await apiGet<MetricsRadarResponse>(
          `/api/v1/candidate-assessments/${params.id}/metrics-radar`,
          { headers: getAuthHeaders() }
        );

        if (isMounted) {
          setData(response);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof ApiError ? err.message : "Failed to laod cohort data";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMetricsRadar();

    return () => {
      isMounted = false;
    }
  }, [params.id]);

  const chartData = useMemo(()=>{
    if (!data) return [];
    return buildChartData(data);
  }, [data]);

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (error) {
    return <p>{ error }</p>
  }

  if (!data) {
    return <p>No radar data available.</p>
  }

  return (
    <div className="rounded-lg border border-default-border bg-secondary-surface p-4">
      <div className="mb-4">
        <h2 className="font-staatliches text-xl tracking-[0.06em] text-default-text">
          Behavioural Radar
        </h2>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} outerRadius={"75%"}>
            <PolarGrid stroke="var(--color-default-border)" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="label"
              tick={{
                fill: "var(--color-default-text)",
                fontSize: 11,
                fontFamily: "var(--font-ibm-plex)",
              }}
            />
            <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
            <Tooltip
              formatter={formatTooltipValue}
              labelStyle={{
                color: "var(--color-default-text)",
                fontFamily: "var(--font-ibm-plex)",
              }}
              contentStyle={{
                backgroundColor: "var(--color-secondary-surface)",
                border: "1px solid var(--color-default-border)",
                borderRadius: "8px",
                color: "var(--color-default-text)",
              }}
            />

            {data.insufficient_cohort_data ? (
              <Radar
                name="Candidate"
                dataKey="candidate"
                stroke="var(--color-system-red)"
                fill="var(--color-system-red)"
                fillOpacity={0.45}
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: "var(--color-system-red)",
                  stroke: "var(--color-secondary-surface)",
                  strokeWidth: 1,
                }}
              />
            ) : (
              <>
                <Radar
                  name="Cohort Average"
                  dataKey="cohort"
                  stroke="var(--color-default-text)"
                  fill="var(--color-default-text)"
                  fillOpacity={0.12}
                  strokeDasharray="6 6"
                  strokeWidth={2}
                />
                <Radar
                  name="Candidate"
                  dataKey="candidate"
                  stroke="var(--color-system-red)"
                  fill="var(--color-system-red)"
                  fillOpacity={0.35}
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "var(--color-system-red)",
                    stroke: "var(--color-secondary-surface)",
                    strokeWidth: 1,
                  }}
                />
              </>
            )}            
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {data.insufficient_cohort_data ? (
        <p className="mt-3 text-sm text-default-text/70">
          Not enough completed attempts yet for a cohort comparison.
        </p>
      ) : null}
    </div>
  )
}

export default MetricsRadar;