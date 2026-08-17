"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AssessmentCard from "../../../../components/admin/ui/cards/assessment-card";
import AssessmentFilterBar from "../../../../components/admin/ui/buttons/assessment-filter-bar";
import CreateAssessmentPanel from "../../../../components/admin/ui/cards/create-assessment-panel";
import type { AssessmentStatus } from "../../types/assessment";
import { isAuthenticated, getRole, getAuthHeaders } from "@/lib/auth";
import { apiGet } from "@/lib/apiClient";
import PageHelpDrawer from "@/components/admin/ui/help/page-help-drawer";
import { HelpCircle } from "lucide-react";
import { PAGE_HELP_CONTENT } from "@/components/admin/ui/help/page-help-content";

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
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpConfig = PAGE_HELP_CONTENT["/assessments"];

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

  const loadAssessments = useCallback(async () => {
    try {
      setLoadingData(true);
      setDataError(null);
      const data = await apiGet<ApiAssessment[]>("/api/v1/assessments", {
        headers: getAuthHeaders(),
      });
      setAssessments(data);
    } catch (err) {
      setDataError(
        err instanceof Error ? err.message : "Failed to load assessments."
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    const load = async () => {
      await loadAssessments();
    };
    load();
  }, [authChecked, loadAssessments]);

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


      <div className="flex flex-col flex-1 min-w-0">

        <main className="flex-1 overflow-y-auto px-7 py-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="font-staatliches text-[30px] tracking-[0.06em] leading-none text-default-text">
                ASSESSMENT ARSENAL
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button title="Open the help guide" type="button" onClick={()=>setIsHelpOpen(true)} className="flex items-center gap-2 bg-tertiary-surface text-default-text border border-default-border hover:bg-secondary-surface px-4 py-2 rounded transition-colors text-sm font-medium uppercase tracking-wide cursor-pointer">
                <HelpCircle size={18}/>
                <span>Help</span>
              </button>

              {/*Create Assessment button*/}
              <button
                type="button"
                title="Create a new assessment."
                onClick={() => setPanelOpen(true)}
                className="flex items-center gap-2 bg-default-text text-background border border-transparent hover:bg-transparent hover:text-system-red hover:border-system-red px-4 py-2 rounded transition-colors text-sm font-staatliches tracking-wider"
              >
                <span>+ New Assessment</span>
              </button>              
            </div>
          </div>

          <PageHelpDrawer
            open={isHelpOpen}
            onClose={()=>setIsHelpOpen(false)}
            config={helpConfig}
          />

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
            <div title="Assign assessments to candidates" className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-3.5">
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
        <CreateAssessmentPanel
          onClose={() => setPanelOpen(false)}
          onCreated={loadAssessments}
        />
      )}
    </div>
  );
}
