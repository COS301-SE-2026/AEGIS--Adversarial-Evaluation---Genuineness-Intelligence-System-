"use client";

interface BehavioralSummaryPanelProps {
    summary: string | null;
}

const BehavioralSummaryPanel = ({
    summary,
}: Readonly<BehavioralSummaryPanelProps>) => {
    return (
        <div className="bg-secondary-surface rounded-lg border border-default-border p-4 sm:p-6">
            <h3 className="font-staatliches text-lg tracking-[0.04em] text-default-text mb-3">
                Behavioral Summary
            </h3>

            {summary ? (
                <p className="text-sm sm:text-base leading-relaxed text-default-text whitespace-pre-line">
                    {summary}
                </p>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-default-text/60">
                        No behavioral summary has been generated yet.
                    </p>
                    <p className="mt-1 text-xs text-default-text/40">
                        This becomes available once the candidate has
                        submitted the assessment.
                    </p>
                </div>
            )}
        </div>
    );
};

export default BehavioralSummaryPanel;
