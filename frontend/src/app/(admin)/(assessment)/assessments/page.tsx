"use client";

import AdminSidebar from "../../../../components/admin/layouts/sidebar";
import AdminTopbar from "../../../../components/admin/layouts/topbar";
import AssessmentCard from "../../../../components/admin/ui/cards/assessment-card";
import { MOCK_ASSESSMENTS } from "../../types/mock-data";

export default function AssessmentsPage() {
  return (
    <div className="flex min-h-screen bg-[#121211] text-[#F5F5F5]">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto px-7 py-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="font-staatliches text-[30px] tracking-[0.06em] leading-none text-[#F5F5F5]">
                ASSESSMENT ARSENAL
              </h1>
              <p className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)] mt-1">
                // manage, deploy, and monitor adversarial assessment sets
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-3.5">
            {MOCK_ASSESSMENTS.map((a) => (
              <AssessmentCard key={a.id} assessment={a} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}