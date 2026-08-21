import { CandidateMetrics } from "@/app/(admin)/types/metrics";

interface MetricsTableProps {
    metrics: CandidateMetrics[];
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  return formatted;
}

function isPasteHeavy(metric: CandidateMetrics): boolean {
  const totalChars = metric.chars_alnum + metric.paste_char_count;
  if (totalChars == 0) return false;
  return metric.paste_char_count / totalChars > 0.5;
}

function isFrequentTabSwitching(metric: CandidateMetrics): boolean {
  return metric.focus_loss_count >= 3 || metric.focus_loss_time_ms > 60000;
}

const MetricsTable = ({
    metrics,
}: Readonly<MetricsTableProps>) => {
  if (metrics.length == 0) {
        return (
      <div className="bg-secondary-surface rounded-lg border border-default-border px-6 py-12 text-center">
        <p className="font-staatliches text-lg tracking-[0.04em] text-default-text">
          No behavioural metrics available
        </p>
        <p className="mt-2 text-sm text-default-text/60">
          Metrics will appear here once the candidate has responded.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-secondary-surface rounded-lg border border-default-border overflow-hidden">
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-225">
          <thead>
            <tr className="border-b border-default-border">
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                Response ID
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                Active Time (ms)
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                Unique Keys
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                Alnum Chars
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                Special Chars
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                Backspace
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                Copy Count
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                Paste Count
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                Paste Chars
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                Focus Loss
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                Loss Time
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-default-text font-semibold text-xs sm:text-sm">
                Flags
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr
                key={metric.candidate_response_id}
                className="border-b border-default-border hover:bg-tertiary-surface transition-colors"
              >
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-default-text font-medium text-sm">
                  {metric.candidate_response_id}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-default-text text-xs sm:text-sm">
                  {metric.active_time_ms}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-default-text text-xs sm:text-sm">
                  {metric.unique_keys_count}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-default-text text-xs sm:text-sm">
                  {metric.chars_alnum}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-default-text text-xs sm:text-sm">
                  {metric.chars_special}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-default-text text-xs sm:text-sm">
                  {metric.backspace_count}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-default-text text-xs sm:text-sm">
                  {metric.copy_event_count}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-default-text text-xs sm:text-sm">
                  {metric.paste_event_count}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-default-text text-xs sm:text-sm">
                  {metric.paste_char_count}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-default-text text-xs sm:text-sm">
                  {metric.focus_loss_count}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-default-text text-xs sm:text-sm">
                  {formatDuration(metric.focus_loss_time_ms)}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {isPasteHeavy(metric) && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-system-red/20 text-system-red mr-1">
                        Paste Heavy
                      </span>
                    )}
                    {isFrequentTabSwitching(metric) && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-status-warning/20 text-status-warning">
                        Frequent tab switching
                      </span>
                    )}

                    {!isPasteHeavy(metric) && !isFrequentTabSwitching(metric) && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-status-success/20 text-status-success">
                        No flags
                      </span>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricsTable;