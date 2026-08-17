import { CandidateMetrics } from "@/app/(admin)/types/metrics";

interface MetricsTableProps {
    metrics: CandidateMetrics[];
}

const MetricsTable = ({
    metrics,
}: Readonly<MetricsTableProps>) => {
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
                Loss Time (ms)
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
                  {metric.focus_loss_time_ms}
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