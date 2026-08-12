import { InfoCard } from "@/components/candidate/ui/cards/report-info-card";
import { AssessmentBarChartContainer } from "@/components/admin/ui/dashboard/assessment-bar-chart-container";

export default function DashboardPage() {
  return (
    <section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        
        <InfoCard title="Top Performers" value={10} />
        <InfoCard title="Total Assessments" value={8} />
        <InfoCard title="AI Flagged" value={1} />

      </div>

      <div className="rounded-xl mt-8">

        <AssessmentBarChartContainer/>

      </div>

    </section>
  );
}
