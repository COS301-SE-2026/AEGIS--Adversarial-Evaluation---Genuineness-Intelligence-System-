"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../../components/admin/layouts/sidebar";
import AdminTopbar from "../../../../components/admin/layouts/topbar";
import AssessmentCard from "../../../../components/admin/ui/cards/assessment-card";
import AssessmentFilterBar from "../../../../components/admin/ui/buttons/assessment-filter-bar";
import CreateAssessmentPanel from "../../../../components/admin/ui/cards/create-assessment-panel";
import type { AssessmentStatus } from "../../types/assessment";
import { isAuthenticated, getRole, getAuthHeaders } from "@/lib/auth";
import { apiGet } from "@/lib/apiClient";

type FilterValue = AssessmentStatus | "all";

interface ApiAssessment {
  assessment_id: number;
  title: string;
  description?: string | null;
  duration_mins: number;
  created_at: string;
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [assessments, setAssessments] = useState<ApiAssessment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated() || getRole() !== "RECRUITER") {
        router.replace("/login");
        return;
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    let isMounted = true;
    const loadAssessments = async () => {
      try {
        setLoadingData(true);
        setDataError(null);
        const data = await apiGet<ApiAssessment[]>("/api/v1/assessments", {
          headers: getAuthHeaders(),
        });
        if (isMounted) setAssessments(data);
      } catch (err) {
        if (isMounted) {
          setDataError(
            err instanceof Error ? err.message : "Failed to load assessments."
          );
        }
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadAssessments();
    return () => {
      isMounted = false;
    };
  }, [authChecked]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen bg-background text-white-smoke items-center justify-center">
        <div className="font-jetbrains text-[12px] text-white-smoke/40">
          Checking access...
        </div>
      </div>
    );
  }

  const filtered = assessments.filter((a) => {
    const matchSearch =
      !search || a.title.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="flex min-h-screen bg-background text-white-smoke">
      <AdminSidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopbar  />

        <main className="flex-1 overflow-y-auto px-7 py-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="font-staatliches text-[30px] tracking-[0.06em] leading-none text-[#F5F5F5]">
                ASSESSMENT ARSENAL
              </h1>
              <p className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)] mt-1">
                {"// manage, deploy, and monitor adversarial assessment sets"}
              </p>
            </div>
            {/*Create Assessment button*/}
            <button
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-2 bg-default-text text-background border border-transparent hover:bg-transparent hover:text-system-red hover:border-system-red px-4 py-2 rounded transition-colors text-sm font-staatliches tracking-wider">
              <span>+ New Assessment</span>
            </button>
          </div>

          <AssessmentFilterBar
            filter={filter}
            search={search}
            onFilterChange={(f) => setFilter(f as FilterValue)}
            onSearchChange={setSearch}
          />

          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="font-jetbrains text-[12px] text-white-smoke/40">
                Loading assessments...
              </div>
            </div>
          ) : dataError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="font-jetbrains text-[12px] text-system-red">
                {dataError}
              </div>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-3.5">
              {filtered.map((a) => (
                <AssessmentCard key={a.assessment_id} assessment={a} />
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

      {panelOpen && (
        <CreateAssessmentPanel onClose={() => setPanelOpen(false)} />
      )}
    </div>
  );
}
