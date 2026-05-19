"use client";

import { useState, useMemo } from "react";
import AdminSidebar from "../../../../components/admin/layouts/sidebar";
import AdminTopbar from "../../../../components/admin/layouts/topbar";
import AssessmentCard from "../../../../components/admin/ui/cards/assessment-card";
import AssessmentFilterBar from "../../../../components/admin/ui/buttons/assessment-filter-bar";
import { MOCK_ASSESSMENTS } from "../../types/mock-data";
import type { AssessmentStatus } from "../../types/assessment";

type FilterValue = AssessmentStatus | "all";

export default function AssessmentsPage() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");

  const filteredAndSorted = useMemo(() => {
    // Filter by status and search
    let filtered = MOCK_ASSESSMENTS.filter((a) => {
      const matchStatus = filter === "all" || a.status === filter;
      const matchSearch =
        !search || a.title.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });

    // Sort by created date
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created);
      const dateB = new Date(b.created);
      return sortOrder === "recent"
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });
    return sorted;
  }, [filter, search, sortOrder]);

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === "recent" ? "oldest" : "recent"));
  };

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

          <AssessmentFilterBar
            filter={filter}
            search={search}
            sortOrder={sortOrder}
            onFilterChange={(f) => setFilter(f)}
            onSearchChange={setSearch}
            onSortToggle={handleSortToggle}
          />

          {filteredAndSorted.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-3.5">
              {filteredAndSorted.map((a) => (
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
    </div>
  );
}