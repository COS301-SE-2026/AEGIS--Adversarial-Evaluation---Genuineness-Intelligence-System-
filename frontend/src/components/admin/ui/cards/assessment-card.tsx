"use client";

import { useState } from "react";
//import { apiGet, apiPost } from "@/lib/apiClient";
//import { getAuthHeaders } from "@/lib/auth";
import CandidateAssignmentModal from "@/components/admin/ui/modals/candidate-assignment-modal";

export interface AdminCardAssessment {
  assessment_id: number;
  title: string;
  description?: string | null;
  duration_mins?: number;
  created_at?: string;
  status?: "active" | "closed" | "pending" | "draft";
  role?: string;
  difficulty?: string;
  types?: string[];
  langs?: string[];
  questions?: number;
  candidates?: number;
  completed?: number;
  aiRate?: number;
}

interface ApiCandidate {
  user_id: number;
  email: string;
  full_name: string | null;
}

interface InviteResponse {
  access_link: string;
}

function StatusBadge({ status = "pending" }: { status?: string }) {
  const config: Record<string, { cls: string; text: string }> = {
    active:  { cls: "bg-[rgba(56,142,60,0.18)] text-[#66BB6A] border border-[rgba(56,142,60,0.3)]",  text: "ACTIVE"  },
    closed:  { cls: "bg-[rgba(51,51,49,0.6)] text-[rgba(245,245,245,0.42)] border border-[#333331]", text: "CLOSED"  },
    pending: { cls: "bg-[rgba(249,168,37,0.15)] text-[#FFCA28] border border-[rgba(249,168,37,0.3)]",text: "PENDING" },
    draft:   { cls: "bg-[rgba(21,101,192,0.15)] text-[#64B5F6] border border-[rgba(21,101,192,0.3)]",text: "DRAFT"   },
  };

  const { cls, text } = config[status] ?? {
    cls: "bg-[rgba(153,153,153,0.15)] text-[rgba(245,245,245,0.6)] border border-[rgba(153,153,153,0.3)]",
    text: status,
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[5px] font-jetbrains text-[9px] tracking-[0.04em] whitespace-nowrap ${cls}`}>
      {text}
    </span>
  );
}

const accentColour: Record<string, string> = {
  active:  "#388E3C",
  pending: "#F9A825",
  closed:  "#333331",
  draft:   "#333331",
};



interface AssessmentCardProps {
  assessment: AdminCardAssessment;
  onAssigned?: (assessmentId: number, count: number) => void;
}

export default function AssessmentCard({ assessment: a, onAssigned }: AssessmentCardProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const candidates = a.candidates ?? 0;
  const completed = a.completed ?? 0;
  const completionPct = candidates > 0 ? Math.round((completed / candidates) * 100) : 0;
  const aiRate = a.aiRate ?? 0;
  const aiHighlight = aiRate >= 70;
  const createdLabel = a.created_at ? a.created_at.split("T")[0] : "—";

  return (
    <div className="
        bg-secondary-surface border border-tertiary-surface rounded-[5px]
        px-5 py-4.5 cursor-pointer relative overflow-hidden
        transition-all duration-150
        hover:bg-tertiary-surface hover:border-system-red/40
        group
      "
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[5px]"
        style={{ background: accentColour[a.status ?? "pending"] ?? "#333331" }}
      />

      <div className="flex items-start justify-between mb-2.5">
        <div className="font-staatliches text-lg tracking-[0.04em] leading-[1.1] text-white-smoke flex-1 pr-2.5">
          {a.title}
        </div>
        {/* <StatusBadge status={a.status?.toLowerCase()} /> */}
      </div>

      {/* <div className="flex flex-wrap gap-2.5 mb-3 font-jetbrains text-[10px] text-white-smoke/40">
        <span className="flex items-center gap-1">{a.role ?? "—"}</span>
        <span className="flex items-center gap-1">{a.difficulty ?? "—"}</span>
        <span className="flex items-center gap-1">{a.questions ?? 0} Qs</span>
        <span className="text-[9px] text-white-smoke/30">{(a.langs ?? []).join(", ")}</span>
      </div> */}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {(a.types ?? []).map((t) => (
          <span
            key={t}
            className="font-jetbrains text-[9px] px-2 py-0.5 bg-tertiary-surface border border-default-border/30 rounded-[5px] text-white-smoke/40 tracking-[0.04em]"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-tertiary-surface pt-3">
        <div className="text-center">
          <div className="font-staatliches text-[20px] tracking-[0.02em] leading-none text-white-smoke">
            {candidates}
          </div>
          <div className="font-jetbrains text-[8px] text-white-smoke/40 tracking-[0.06em] uppercase mt-0.5">
            Candidates
          </div>
        </div>
        <div className="text-center">
          <div className="font-staatliches text-[20px] tracking-[0.02em] leading-none text-white-smoke">
            {completionPct}%
          </div>
          <div className="font-jetbrains text-[8px] text-white-smoke/40 tracking-[0.06em] uppercase mt-0.5">
            Completed
          </div>
        </div>
        {/* <div className="text-center">
          <div className={`font-staatliches text-[20px] tracking-[0.02em] leading-none ${aiHighlight ? "text-system-red" : "text-white-smoke"}`}>
            {aiRate > 0 ? `${aiRate}%` : "—"}
          </div>
          <div className="font-jetbrains text-[8px] text-white-smoke/40 tracking-[0.06em] uppercase mt-0.5">
            AI Detect
          </div>
        </div> */}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-tertiary-surface">
        <div className="font-jetbrains text-[10px] text-white-smoke/40">
          {createdLabel}
        </div>
        <div className="flex gap-1.5">
          
          {/* <button
            type="button"
            aria-label="Edit assessment"
            className="bg-transparent border border-tertiary-surface text-white-smoke/40 p-1 px-2 rounded-[5px] cursor-pointer transition-all duration-150 flex items-center hover:border-system-red hover:text-system-red"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button> */}

          <button
            type="button"
            aria-label="Assign to candidates"
            onClick={(e) => {
              e.stopPropagation();
              setAssignOpen(true);
            }}
            className="bg-transparent border border-system-red/30 text-system-red/70 p-1 px-2 rounded-[5px] cursor-pointer transition-all duration-150 flex items-center gap-1 hover:border-system-red hover:text-system-red"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>

        </div>        
      </div>
      {assignOpen && (
        <CandidateAssignmentModal
          assessmentId={a.assessment_id}
          assessmentTitle={a.title}
          onClose={() => setAssignOpen(false)}
          onAssigned={(count: number) => onAssigned?.(a.assessment_id, count)}
        />
      )}
    </div>
  );
}
