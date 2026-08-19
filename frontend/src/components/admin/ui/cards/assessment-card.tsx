"use client";

import { useState, useRef, useEffect } from "react";
import { apiGet, apiPost } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
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

function AssignDropdown({ assessmentId, assessmentTitle }: { assessmentId: number; assessmentTitle: string }) {
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<ApiCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<number[]>([]);
  const [flash, setFlash] = useState<number | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [accessLink, setAccessLink] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      setFetchError(null);

      apiGet<ApiCandidate[]>("/api/v1/users/candidates", { headers: getAuthHeaders() })
        .then((data) => { if (isMounted) setCandidates(data); })
        .catch((err) => {
          if (isMounted) {
            setFetchError(err instanceof Error ? err.message : "Failed to load candidates.");
          }
        })
        .finally(() => { if (isMounted) setLoadingCandidates(false); });
    };

    fetchCandidates();
    return () => { isMounted = false; };
  }, [open]);

  const handleAssign = async (candidate: ApiCandidate) => {
    if (assigned.includes(candidate.user_id)) return;
    setFlash(candidate.user_id);
    setInviteError(null);

    try {
      const result = await apiPost<InviteResponse, { candidate_id: number }>(
        `/api/v1/assessments/${assessmentId}/invite`,
        { candidate_id: candidate.user_id },
        { headers: getAuthHeaders() }
      );
      setAssigned((prev) => [...prev, candidate.user_id]);
      setAccessLink(result.access_link);
      navigator.clipboard.writeText(result.access_link);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite.");
    }

    setTimeout(() => setFlash(null), 900);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Assign to candidate"
        onClick={() => setOpen((o) => !o)}
        className={`bg-transparent border p-1 px-2 rounded-[5px] cursor-pointer transition-all duration-150 flex items-center gap-1 ${
          open || assigned.length > 0
            ? "border-system-red text-system-red"
            : "border-system-red/30 text-system-red/70 hover:border-system-red hover:text-system-red"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        {assigned.length > 0 && (
          <span className="font-jetbrains text-[9px]">{assigned.length}</span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1.5 w-55 bg-secondary-surface border border-tertiary-surface rounded-[5px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] z-20 overflow-hidden">
          {accessLink && (
            <div className="px-3 py-2 border-b border-tertiary-surface bg-[rgba(56,142,60,0.08)]">
              <div className="font-staatliches text-[11px] tracking-[0.04em] text-status-success mb-1">
                INVITE LINK
              </div>
              <div className="font-jetbrains text-[9px] text-white-smoke/60 break-all leading-relaxed">
                {accessLink}
              </div>
            </div>
          )}

          <div className="px-3 py-2 border-b border-tertiary-surface">
            <div className="font-staatliches text-[12px] tracking-[0.06em] text-white-smoke">ASSIGN TO</div>
            <div className="font-jetbrains text-[9px] text-white-smoke/40 mt-0.5 truncate">
              {assessmentTitle}
            </div>
          </div>

          {(fetchError || inviteError) && (
            <div className="px-3 py-1.5 font-jetbrains text-[9px] text-system-red">
              {fetchError ?? inviteError}
            </div>
          )}

          <div className="py-1">
            {loadingCandidates ? (
              <div className="px-3 py-2 font-jetbrains text-[9px] text-white-smoke/40">
                Loading...
              </div>
            ) : (
              candidates.map((c) => {
                const isAssigned = assigned.includes(c.user_id);
                const isFlashing = flash === c.user_id;
                const displayName = c.full_name ?? c.email;
                return (
                  <button
                    type="button"
                    key={c.user_id}
                    onClick={() => { handleAssign(c); }}
                    disabled={isAssigned}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-all duration-150 ${
                      isFlashing
                        ? "bg-[rgba(56,142,60,0.15)]"
                        : isAssigned
                        ? "opacity-50 cursor-default"
                        : "hover:bg-system-red/8 cursor-pointer"
                    }`}
                  >
                    <span className="font-staatliches text-[13px] tracking-[0.04em] text-white-smoke">
                      {displayName}
                    </span>
                    {isAssigned ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#66BB6A" strokeWidth="2.5" className="shrink-0">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-white-smoke/30">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
        <StatusBadge status={a.status?.toLowerCase()} />
      </div>

      <div className="flex flex-wrap gap-2.5 mb-3 font-jetbrains text-[10px] text-white-smoke/40">
        <span className="flex items-center gap-1">{a.role ?? "—"}</span>
        <span className="flex items-center gap-1">{a.difficulty ?? "—"}</span>
        <span className="flex items-center gap-1">{a.questions ?? 0} Qs</span>
        <span className="text-[9px] text-white-smoke/30">{(a.langs ?? []).join(", ")}</span>
      </div>

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
        <div className="text-center">
          <div className={`font-staatliches text-[20px] tracking-[0.02em] leading-none ${aiHighlight ? "text-system-red" : "text-white-smoke"}`}>
            {aiRate > 0 ? `${aiRate}%` : "—"}
          </div>
          <div className="font-jetbrains text-[8px] text-white-smoke/40 tracking-[0.06em] uppercase mt-0.5">
            AI Detect
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-tertiary-surface">
        <div className="font-jetbrains text-[10px] text-white-smoke/40">
          {createdLabel}
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Edit assessment"
            className="bg-transparent border border-tertiary-surface text-white-smoke/40 p-1 px-2 rounded-[5px] cursor-pointer transition-all duration-150 flex items-center hover:border-system-red hover:text-system-red"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <AssignDropdown assessmentId={a.assessment_id} assessmentTitle={a.title} />
        </div>
      </div>
    </div>
  );
}
