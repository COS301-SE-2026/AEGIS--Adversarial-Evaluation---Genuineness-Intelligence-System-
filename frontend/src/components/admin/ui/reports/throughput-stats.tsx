import type { ThroughputResponse } from "@/app/(admin)/types/reporting";

interface ThroughputStatsProps {
  data: ThroughputResponse;
}

function formatSeconds(seconds: number | null): string {
  if (seconds === null) return "—";
  const totalMinutes = Math.floor(seconds / 60);
  const remSeconds = Math.round(seconds % 60);
  return `${totalMinutes}m ${remSeconds.toString().padStart(2, "0")}s`;
}

export function ThroughputStats({ data }: Readonly<ThroughputStatsProps>) {
  const tiles: { label: string; value: string | number }[] = [
    { label: "Total Assessments", value: data.total_assessments },
    { label: "Active", value: data.active_count },
    { label: "Completed", value: data.completed_count },
    { label: "Expired", value: data.expired_count },
    { label: "Average Time to Completion", value: formatSeconds(data.avg_time_to_completion_seconds) },
    { label: "Average Score", value: data.avg_score !== null ? `${data.avg_score.toFixed(1)}%` : "—" },
    { label: "Completion Rate", value: `${Math.round(data.completion_rate * 100)}%` },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="bg-secondary-surface border border-default-border rounded-lg px-4 py-4"
          >
            <p className="font-jetbrains text-[10px] tracking-wider text-default-border uppercase">
              {tile.label}
            </p>
            <p className="font-staatliches text-2xl tracking-wide text-default-text mt-1">
              {tile.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}