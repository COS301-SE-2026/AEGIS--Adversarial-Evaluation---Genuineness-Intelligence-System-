"use client";

import { useState } from "react";
import AdminSidebar from "../../../../components/admin/layouts/sidebar";
import AdminTopbar from "../../../../components/admin/layouts/topbar";
import AssessmentCard from "../../../../components/admin/ui/cards/assessment-card";
import AssessmentFilterBar from "../../../../components/admin/ui/buttons/assessment-filter-bar";
import CreateAssessmentPanel from "../../../../components/admin/ui/cards/create-assessment-panel";
import { MOCK_ASSESSMENTS } from "../../types/mock-data";
import type { AssessmentStatus } from "../../types/assessment";

type FilterValue = AssessmentStatus | "all";

export default function AssessmentsPage() {
  const [filter, setFilter]   = useState<FilterValue>("all");
  const [search, setSearch]   = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  const filtered = MOCK_ASSESSMENTS.filter((a) => {
    const matchStatus = filter === "all" || a.status === filter;
    const matchSearch =
      !search || a.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#121211] text-[#F5F5F5]">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar — transparent per Figma */}
        <AdminTopbar onNewAssessment={() => setPanelOpen(true)} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-7 py-6">
          {/* Page header */}
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

          {/* Filter bar */}
          <AssessmentFilterBar
            filter={filter}
            search={search}
            onFilterChange={(f) => setFilter(f as FilterValue)}
            onSearchChange={setSearch}
          />

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-3.5">
              {filtered.map((a) => (
                <AssessmentCard key={a.id} assessment={a} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="font-staatliches text-[22px] tracking-[0.06em] text-[rgba(245,245,245,0.22)] mb-2">
                NO ASSESSMENTS FOUND
              </div>
              <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.22)]">
                Try adjusting your filters or create a new assessment.
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create assessment slide-over panel */}
      {panelOpen && (
        <CreateAssessmentPanel onClose={() => setPanelOpen(false)} />
      )}
    </div>
  );
}