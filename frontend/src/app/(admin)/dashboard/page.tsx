import { InfoCard } from "@/components/candidate/ui/cards/report-info-card";

export default function DashboardPage() {
  return (
    <section>
      
      <div className="mn-6">
        <h1>Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <InfoCard title="Total Assessments" value={10} />
        <InfoCard title="Passed" value={8} />
        <InfoCard title="Failed" value={2} />
        <InfoCard title="AI Flagged" value={1} />
      </div>

    </section>
  );
}
