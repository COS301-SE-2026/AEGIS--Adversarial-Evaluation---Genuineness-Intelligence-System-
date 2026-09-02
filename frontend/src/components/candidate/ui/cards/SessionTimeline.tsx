"use client";

import type {
    MetricsTimelineResponse,
    TimelineEvent,
} from "@/app/(admin)/types/reporting-timeline";

interface SessionTimelineProps {
    timeline: MetricsTimelineResponse;
}

function formatDuration(ms: number): string {
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
        return `${seconds}s`;
    }

    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function EventBadge({ event }: Readonly<{ event: TimelineEvent }>) {
    switch (event.event_type) {
        case "paste":
            return (
                <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-system-red/20 text-system-red">
                     Paste ({event.magnitude ?? 0} chars)
                </span>
            );

        case "focus_loss":
            return (
                <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-status-warning/20 text-status-warning">
                     Focus Loss (×{event.magnitude ?? 0})
                </span>
            );

        case "typing_burst":
            return (
                <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-status-info/20 text-status-info">
                     High Speed
                </span>
            );

        default:
            return null;
    }
}

const SessionTimeline = ({ timeline }: Readonly<SessionTimelineProps>) => {
    const { total_active_time_ms, questions } = timeline;

    if (questions.length === 0) {
        return (
            <div className="bg-secondary-surface rounded-lg border border-default-border px-6 py-12 text-center">
                <p className="font-staatliches text-lg tracking-[0.04em] text-default-text">
                    No question activity recorded
                </p>
            </div>
        );
    }

    const hasActiveTime = total_active_time_ms > 0;

    return (
        <div className="bg-secondary-surface rounded-lg border border-default-border p-4 sm:p-6">
            <div className="mb-4">
                <h3 className="font-staatliches text-lg tracking-[0.04em] text-default-text">
                    Session Timeline
                </h3>
                <p className="mt-1 text-xs text-default-text/60">
                    Questions, in assessment order — not necessarily the
                    order the candidate answered them in.
                </p>
            </div>

            <div className="flex w-full items-stretch gap-1.5">
                {questions.map((question) => {
                    const widthPercent = hasActiveTime
                        ? (question.active_time_ms / total_active_time_ms) *
                          100
                        : 100 / questions.length;

                    return (
                        <div
                            key={`${question.question_id}-${question.question_order}`}
                            style={{ width: `${widthPercent}%` }}
                            className="min-w-0 flex flex-col gap-2 rounded-md border border-default-border bg-tertiary-surface px-3 py-3"
                        >
                            <p className="text-xs sm:text-sm font-medium leading-snug text-default-text">
                                Question {question.question_order}:{" "}
                                {formatDuration(question.active_time_ms)}
                            </p>

                            {question.events.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {question.events.map((event, index) => (
                                        <EventBadge
                                            key={`${question.question_id}-${event.event_type}-${index}`}
                                            event={event}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-default-text/40">
                                    No flagged activity
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SessionTimeline;
