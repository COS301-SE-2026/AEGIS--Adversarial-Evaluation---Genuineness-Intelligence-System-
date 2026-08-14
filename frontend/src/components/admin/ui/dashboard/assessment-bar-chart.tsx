"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BarChartData } from "@/types/dashboard-types";

interface AssessmentBarChartProps {
  data: BarChartData[];
}

type SortOrder = "desc" | "asc";

const MAX_VISIBLE_ASSESSMENTS = 5;

export function AssessmentBarChart({
  data,
}: Readonly<AssessmentBarChartProps>) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const visibleData = useMemo(() => {
    return [...data]
      .sort((a, b) =>
        sortOrder === "desc"
          ? b.average_score_percent - a.average_score_percent
          : a.average_score_percent - b.average_score_percent,
      )
      .slice(0, MAX_VISIBLE_ASSESSMENTS);
  }, [data, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((current) => (current === "desc" ? "asc" : "desc"));
  };

  return (
    <div className="w-full">
      
        <div className="flex items-start justify-between gap-4 mb-4">
          
          <div>
            <h2 className="text-xl tracking-wide">
              Assessment Performance Chart
            </h2>
          </div>

          <button
            type="button"
            onClick={toggleSortOrder}
            className="inline-flex font-staatliches text-sm tracking-widest items-center gap-2 border rounded-lg border-default-text bg-default-text px-3 py-2  text-background transition-color hover:bg-transparent hover:text-default-text"
            aria-label={`Sort assessments ${
              sortOrder === "desc" ? "lowest to highest" : "highest to lowest"
            }`}
          >
            <span className="uppercase tracking-widest">
              {sortOrder === "desc" ? "Highest → Lowest" : "Lowest → Highest"}
            </span>
          </button>

        </div>

          
        
      

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={visibleData}
            layout="vertical"
            margin={{
              top: 5,
              right: 20,
              left: 10,
              bottom: 5,
            }}
            barCategoryGap="35%"
          >
            <CartesianGrid
              stroke="var(--color-tertiary-surface)"
              strokeDasharray="3 3"
              horizontal={false}
              vertical={false}
            />

            <XAxis
              type="number"
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "var(--color-default-text)",
                fontSize: 11,
                fontFamily: "var(--font-ibm-plex)",
              }}
              tickFormatter={(value) => `${value}%`}
            />

            <YAxis
              type="category"
              dataKey="assessment_name"
              width={140}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "var(--color-default-text)",
                fontSize: 12,
                fontFamily: "var(--font-ibm-plex)",
              }}
            />

            <Tooltip
              cursor={{
                fill: "var(--color-secondary-surface)",
                opacity: "0.35",
              }}
              contentStyle={{
                backgroundColor: "var(--color-secondary-surface",
                border: "1px solid var(--color-default-border)",
                borderRadius: "4px",
                color: "var(--color-default-text)",
                fontSize: 14,
                fontFamily: "var(--font-ibm-plex)",
              }}
              labelStyle={{
                color: "var(--color-default-text)",
                fontSize: 14,
                fontFamily: "var(--font-staatliches)",
                letterSpacing: "0.1rem",
                marginBottom: "4px",
              }}
              itemStyle={{
                color: "var(--color-default-text)",
              }}
              formatter={(value) => [
                `${Number(value).toFixed(2)}%`,
                "Average Score",
              ]}
            />

            <Bar
              dataKey="average_score_percent"
              name="Average Score"
              fill="var(--color-default-text)"
              barSize={10}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
