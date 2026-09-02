"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getRole } from "@/lib/auth";
import { HelpCircle } from "lucide-react";
import { ThroughputContainer } from "@/components/admin/ui/reports/throughput-container";
import { QuestionQualityContainer } from "@/components/admin/ui/reports/question-quality-container";
import { PerformanceBreakdownContainer } from "@/components/admin/ui/reports/performance-breakdown-container";
import { IntegritySummaryContainer } from "@/components/admin/ui/reports/integrity-summary-container";

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated() || getRole() !== "RECRUITER") {
        router.replace("/auth?mode=login");
        return;
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen bg-background text-white-smoke items-center justify-center">
        <div className="font-jetbrains text-[12px] text-white-smoke/40">
          Checking access...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-white-smoke">
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-y-auto px-7 py-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="font-staatliches text-[30px] tracking-[0.06em] leading-none text-default-text">
                ASSESSMENT INTELLIGENCE REPORTS
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                title="Help documentation coming soon"
                type="button"
                className="flex items-center gap-2 bg-tertiary-surface text-default-text border border-default-border hover:bg-secondary-surface px-4 py-2 rounded transition-colors text-sm font-medium uppercase tracking-wide cursor-pointer"
              >
                <HelpCircle size={18} />
                <span>Help</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-10">
            <ThroughputContainer />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <QuestionQualityContainer />
              <PerformanceBreakdownContainer />
            </div>

            <IntegritySummaryContainer />
          </div>
        </main>
      </div>
    </div>
  );
}