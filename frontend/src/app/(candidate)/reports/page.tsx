import { InfoCard } from "@/components/candidate/ui/cards/report-info-card"
import { ReportTable } from "@/components/candidate/ui/tables/report-table"

export default function ReportsPage() {
    return (
        <main className=" min-h-screen">
            <div className="mt-8">
                <h1 className="text-2xl text-default-text ">
                    Reports
                </h1>
                <p className="mt-4">View your assessment results.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
               <InfoCard title="Total Assessments" value={10} />
               <InfoCard title="Passed" value={8} />
               <InfoCard title="Failed" value={2} />
               <InfoCard title="AI Flagged" value={1} />
            </div>
            <h2 className="text-2xl text-default-text mt-8 mb-4">
                Assessments
            </h2>
            <div className="mt-8">
                <ReportTable />
            </div>

        </main>
    )
}