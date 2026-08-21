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
            <h2 className="text-2xl text-default-text mt-8 mb-4">
                Assessments
            </h2>
            <div className="mt-8">
                <ReportTable />
            </div>

        </main>
    )
}