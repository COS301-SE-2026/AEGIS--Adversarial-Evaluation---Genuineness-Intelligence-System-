"use client";

import { useState, useRef, useEffect } from "react";
import type { Assessment } from "../../../../app/(admin)/types/assessment";
import { MOCK_CANDIDATES } from "../../../../app/(admin)/types/mock-data";

// ─── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Assessment["status"] }) {
  const config = {
    active:  { cls: "bg-[rgba(56,142,60,0.18)] text-[#66BB6A] border border-[rgba(56,142,60,0.3)]",  text: "ACTIVE"  },
    closed:  { cls: "bg-[rgba(51,51,49,0.6)] text-[rgba(245,245,245,0.42)] border border-[#333331]", text: "CLOSED"  },
    pending: { cls: "bg-[rgba(249,168,37,0.15)] text-[#FFCA28] border border-[rgba(249,168,37,0.3)]",text: "PENDING" },
    draft:   { cls: "bg-[rgba(21,101,192,0.15)] text-[#64B5F6] border border-[rgba(21,101,192,0.3)]",text: "DRAFT"   },
  } as const;

  const { cls, text } = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[5px] font-jetbrains text-[9px] tracking-[0.04em] whitespace-nowrap ${cls}`}>
      {text}
    </span>
  );
}

// ─── Top accent colours per status ────────────────────────────────────────
const accentColour: Record<Assessment["status"], string> = {
  active:  "#388E3C",
  pending: "#F9A825",
  closed:  "#333331",
  draft:   "#333331",
};

// ─── Assign dropdown ──────────────────────────────────────────────────────

function AssignDropdown({ assessmentTitle }: { assessmentTitle: string }) {
  const [open, setOpen] = useState(false);
  const [assigned, setAssigned] = useState<number[]>([]);
  const [flash, setFlash] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleAssign = (candidateId: number) => {
    if (assigned.includes(candidateId)) return;
    setAssigned((prev) => [...prev, candidateId]);
    setFlash(candidateId);
    setTimeout(() => {
      setFlash(null);
      setOpen(false);
    }, 900);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Assign to candidate"
        onClick={() => setOpen((o) => !o)}
        className={`bg-transparent border p-1 px-2 rounded-[5px] cursor-pointer transition-all duration-150 flex items-center gap-1 ${
          open || assigned.length > 0
            ? "border-[#D32F2F] text-[#D32F2F]"
            : "border-[rgba(211,47,47,0.3)] text-[rgba(211,47,47,0.7)] hover:border-[#D32F2F] hover:text-[#D32F2F]"
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
        <div className="absolute bottom-full right-0 mb-1.5 w-[190px] bg-[#1A1C1E] border border-[#333331] rounded-[5px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] z-20 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-[#333331]">
            <div className="font-staatliches text-[12px] tracking-[0.06em] text-[#F5F5F5]">ASSIGN TO</div>
            <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)] mt-0.5 truncate">
              {assessmentTitle}
            </div>
          </div>

          {/* Candidate list */}
          <div className="py-1">
            {MOCK_CANDIDATES.map((c) => {
              const isAssigned = assigned.includes(c.id);
              const isFlashing = flash === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleAssign(c.id)}
                  disabled={isAssigned}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-all duration-150 ${
                    isFlashing
                      ? "bg-[rgba(56,142,60,0.15)]"
                      : isAssigned
                      ? "opacity-50 cursor-default"
                      : "hover:bg-[rgba(211,47,47,0.08)] cursor-pointer"
                  }`}
                >
                  <span className="font-staatliches text-[13px] tracking-[0.04em] text-[#F5F5F5]">
                    {c.name}
                  </span>
                  {isAssigned ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#66BB6A" strokeWidth="2.5" className="flex-shrink-0">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,245,0.28)" strokeWidth="1.8" className="flex-shrink-0">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────

interface AssessmentCardProps {
  assessment: Assessment;
}

export default function AssessmentCard({ assessment: a }: AssessmentCardProps) {
  const completionPct =
    a.candidates > 0 ? Math.round((a.completed / a.candidates) * 100) : 0;
  const aiHighlight = a.aiRate >= 70;

  return (
    <div className="
        bg-[#292C2F] border border-[#333331] rounded-[5px]
        px-5 py-[18px] cursor-pointer relative overflow-hidden
        transition-all duration-150
        hover:border-[rgba(211,47,47,0.4)] hover:bg-[rgba(41,44,47,0.85)]
        group
      "
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[5px]"
        style={{ background: accentColour[a.status] }}
      />

      {/* Title row */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="font-staatliches text-lg tracking-[0.04em] leading-[1.1] text-[#F5F5F5] flex-1 pr-2.5">
          {a.title}
        </div>
        <StatusBadge status={a.status} />
      </div>

      {/* Meta pills */}
      <div className="flex flex-wrap gap-2.5 mb-3 font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)]">
        <span className="flex items-center gap-1">🎯 {a.role}</span>
        <span className="flex items-center gap-1">📊 {a.difficulty}</span>
        <span className="flex items-center gap-1">❓ {a.questions} Qs</span>
        <span className="text-[9px] text-[rgba(245,245,245,0.28)]">{a.langs.join(", ")}</span>
      </div>

      {/* Type tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {a.types.map((t) => (
          <span
            key={t}
            className="font-jetbrains text-[9px] px-2 py-0.5 bg-[#222426] border border-[#333331] rounded-[5px] text-[rgba(245,245,245,0.22)] tracking-[0.04em]"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 border-t border-[#333331] pt-3">
        <div className="text-center">
          <div className="font-staatliches text-[20px] tracking-[0.02em] leading-none text-[#F5F5F5]">
            {a.candidates}
          </div>
          <div className="font-jetbrains text-[8px] text-[rgba(245,245,245,0.42)] tracking-[0.06em] uppercase mt-0.5">
            Candidates
          </div>
        </div>
        <div className="text-center">
          <div className="font-staatliches text-[20px] tracking-[0.02em] leading-none text-[#F5F5F5]">
            {completionPct}%
          </div>
          <div className="font-jetbrains text-[8px] text-[rgba(245,245,245,0.42)] tracking-[0.06em] uppercase mt-0.5">
            Completed
          </div>
        </div>
        <div className="text-center">
          <div className={`font-staatliches text-[20px] tracking-[0.02em] leading-none ${aiHighlight ? "text-[#EF5350]" : "text-[#F5F5F5]"}`}>
            {a.aiRate > 0 ? `${a.aiRate}%` : "—"}
          </div>
          <div className="font-jetbrains text-[8px] text-[rgba(245,245,245,0.42)] tracking-[0.06em] uppercase mt-0.5">
            AI Detect
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#333331]">
        <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)]">
          {a.created}
        </div>
        <div className="flex gap-1.5">
          {/* Edit */}
          <button
            aria-label="Edit assessment"
            className="bg-transparent border border-[#333331] text-[rgba(245,245,245,0.42)] p-1 px-2 rounded-[5px] cursor-pointer transition-all duration-150 flex items-center hover:border-[#D32F2F] hover:text-[#D32F2F]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          {/* Assign to candidate */}
          <AssignDropdown assessmentTitle={a.title} />
        </div>
      </div>
    </div>
  );
}