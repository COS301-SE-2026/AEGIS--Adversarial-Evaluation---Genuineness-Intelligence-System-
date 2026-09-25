"use client";

import { QuestionAnalytics, REVIEW_BAND_META } from "@/app/(admin)/types/metrics";

interface ReviewScoreCardProps {
    question: QuestionAnalytics;
}

export function ReviewScoreCard({question}: Readonly<ReviewScoreCardProps>) {
    if(!question.review_score && !question.review_band) {
        return null;
    }

    const bandColor = question.review_band ? REVIEW_BAND_META[question.review_band].color : "default-border";

    return (
        <div className="bg-background border border-tertiary-surface rounded-lg p-4">
            <h4 className="text-sm uppercase tracking-widest text-default-text mb-4">
                Review Question
            </h4>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-sm text-default-text/90 mb-2">Review Score</p>
                    <p className="text-3xl font-bold font-jetbrains-mono text-default-text">
                        {question.review_score?.toFixed(1) || "N/A"}
                    </p>
                </div>

                <div className="px-4 py-2 rounded-lg border" style={{ backgroundColor: `${bandColor}15`, borderColor: bandColor}}>
                    <p className="text-sm font-bold uppercase" style={{ color: bandColor}}>
                        {question.review_band || "N/A"}
                    </p>
                </div>
            </div>

            {question.contributing_factors.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-bold  tracking-widest text-default-text/90 mb-2">
                        Contributing Factors
                    </p>
                    {question.contributing_factors.map((factor, index) => (
                        <div
                            key={index}
                            className="text-default-text/90"
                        >
                            {factor}
                        </div>
                    ))}
                </div>
            )}

        </div>
    )
}