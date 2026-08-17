import { InfoCard } from "@/components/candidate/ui/cards/report-info-card";
import { AssessmentAnalyticsTableContainer } from "@/components/admin/ui/dashboard/assessment-analytics-table-container";

export default function DashboardPage() {
  return (
    <section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        
        

      </div>

      <div className="flex flex-col justify-between gap-12 rounded-xl mt-8">

        <div className="mb-4">
          <AssessmentAnalyticsTableContainer/>
        </div>

      </div>

    </section>
  );
}
