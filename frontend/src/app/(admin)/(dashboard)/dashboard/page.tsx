import { InfoCard } from "@/components/candidate/ui/cards/report-info-card";
import { AssessmentBarChartContainer } from "@/components/admin/ui/dashboard/assessment-bar-chart-container";
import { AssessmentAnalyticsTableContainer } from "@/components/admin/ui/dashboard/assessment-analytics-table-container";
import { TopPerformer } from "@/types/dashboard-types";


const topPerformers: TopPerformer[] = [
  {
    candidate_name: "Luyanda Ndlovu",
    score_percent: 98,
  },
  {
    candidate_name: "Lesedi Matena",
    score_percent: 97,
  },
  {
    candidate_name: "Ownen Mason",
    score_percent: 93,
  }
]

export default function DashboardPage() {
  return (
    <section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        
        <InfoCard 
          type="ranking" 
          title="Top Performers" 
          items={topPerformers.map((candidate) => ({
            name: candidate.candidate_name,
            value: candidate.score_percent,
          }))} 
          icon="trophy"
        />

        <InfoCard 
          type="metric"
          title="Total Assessments" 
          value={10} 
          icon="chart"
        />

        <InfoCard 
          type="percentage"
          title="AI Usage Rate"
          value={10}
          label="MEDIUM"
          icon="ai"
        />

      </div>

      <div className="flex flex-col justify-between gap-4 rounded-xl mt-2">

        <div className="mb-8">
          <AssessmentBarChartContainer/>
        </div>

        <div className="mb-4">
          <AssessmentAnalyticsTableContainer/>
        </div>

      </div>

    </section>
  );
}
