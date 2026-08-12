"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BarChartData } from "@/types/dashboard-types";

interface AssessmentBarChartProps {
    data: BarChartData[];
}

export function AssessmentBarChart({ data }: Readonly<AssessmentBarChartProps>) {
    return (
        <div className="h-80 w-full">
           
            <ResponsiveContainer
                width="100%"
                height="100%"
            >
                
                <BarChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 20,
                        left: 0,
                        bottom: 20,
                    }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="assessment_name"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={70}
                    />

                    <YAxis
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                    />

                    <Tooltip
                        formatter={(value) => [
                            `${Number(value).toFixed(1)}%`,
                            "Average Score",
                        ]}
                    />

                    <Bar
                        dataKey="average_score_percent"
                        name="Average Score"
                        radius={[6, 6, 0, 0]}
                    />

                </BarChart>

            </ResponsiveContainer>

        </div>
    )
}