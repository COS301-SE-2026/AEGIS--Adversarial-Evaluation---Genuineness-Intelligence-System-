"use client";

import { useState, useCallback } from "react";
import type { Difficulty } from "../../../../app/(admin)/types/assessment";

// ─── Shared label styles ───────────────────────────────────────────────────
const labelCls =
  "font-jetbrains text-[10px] tracking-[0.1em] text-[rgba(245,245,245,0.42)] uppercase font-medium";
const inputCls =
  "w-full bg-[#292C2F] border border-[#333331] text-[#F5F5F5] px-3.5 py-2.5 font-ibm text-[13px] rounded-[5px] outline-none transition-colors duration-150 placeholder:text-[rgba(245,245,245,0.42)] focus:border-[#D32F2F]";
const sectionTitleCls =
  "font-staatliches text-base tracking-[0.07em] text-[#F5F5F5] mb-3.5 flex items-center gap-2 after:flex-1 after:h-px after:bg-[#333331] after:content-['']";

const TARGET_ROLES = [
  "Frontend", "Backend", "Full-Stack", "DevOps",
  "Data Engineering", "Cloud / Infra", "Mobile",
];

const DIFFICULTY_LEVELS: Difficulty[] = ["Junior", "Mid", "Senior", "Lead", "Architect"];
const WIZARD_STEPS = [
  { label: "BASIC INFO",  sub: "Details & role" },
  { label: "QUESTIONS",   sub: "Question types" },
  { label: "SETTINGS",    sub: "Time & proctoring" },
  { label: "REVIEW",      sub: "Deploy" },
];

// ─── Step 0 — Basic Info (fully implemented) ─────────────────────────────

interface BasicInfoForm {
  name: string;
  role: string;
  description: string;
  difficulty: Difficulty;
}

function StepBasicInfo({
  form,
  set,
}: {
  form: BasicInfoForm;
  set: <K extends keyof BasicInfoForm>(k: K, v: BasicInfoForm[K]) => void;
}) {
  return (
    <>
      <div className="mb-6">
        <div className={sectionTitleCls}>Assessment Identity</div>

        <div className="mb-3.5">
          <label className={`${labelCls} block mb-1.5`}>Assessment Title *</label>
          <input
            className={inputCls}
            placeholder="e.g. Senior Backend Algorithm Sprint"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div className="mb-3.5">
          <label className={`${labelCls} block mb-1.5`}>Description</label>
          <textarea
            className={`${inputCls} resize-y min-h-[80px] leading-relaxed`}
            placeholder="Briefly describe the purpose and scope of this assessment..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className={`${labelCls} block mb-1.5`}>Target Role</label>
            <select
              className={`${inputCls} cursor-pointer appearance-none`}
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(245,245,245,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              {TARGET_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`${labelCls} block mb-1.5`}>Seniority Level</label>
            <div className="flex border border-[#333331] rounded-[5px] overflow-hidden">
              {DIFFICULTY_LEVELS.map((d) => (
                <button
                  key={d}
                  onClick={() => set("difficulty", d)}
                  className={`flex-1 py-2 font-staatliches text-[13px] tracking-[0.04em] text-center transition-all duration-150 border-r border-[#333331] last:border-r-0 ${
                    form.difficulty === d
                      ? "bg-[rgba(211,47,47,0.15)] text-[#D32F2F]"
                      : "text-[rgba(245,245,245,0.42)] hover:bg-[rgba(211,47,47,0.06)] hover:text-[#F5F5F5]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.22)] mt-1">
              Sets question complexity and AI trap intensity
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Stubs for other steps (will be replaced later) ─────────────────────

function StepQuestionsStub() {
  return (
    <div className="text-center py-12">
      <div className="font-staatliches text-[18px] text-[rgba(245,245,245,0.42)]">
        QUESTIONS CONFIGURATION
      </div>
      <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.22)] mt-2">
        Coming in next commit
      </div>
    </div>
  );
}

function StepSettingsStub() {
  return (
    <div className="text-center py-12">
      <div className="font-staatliches text-[18px] text-[rgba(245,245,245,0.42)]">
        SETTINGS & TIMING
      </div>
      <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.22)] mt-2">
        Coming in next commit
      </div>
    </div>
  );
}

function StepReviewStub() {
  return (
    <div className="text-center py-12">
      <div className="font-staatliches text-[18px] text-[rgba(245,245,245,0.42)]">
        REVIEW & DEPLOY
      </div>
      <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.22)] mt-2">
        Coming in next commit
      </div>
    </div>
  );
}

// ─── Main panel ─────────────────────────────────────────────────────────

interface CreateAssessmentPanelProps {
  onClose: () => void;
}

const DEFAULT_FORM = {
  name: "",
  role: "Backend",
  description: "",
  difficulty: "Mid" as Difficulty,
};

export default function CreateAssessmentPanel({ onClose }: CreateAssessmentPanelProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULT_FORM);

  const set = useCallback(
    <K extends keyof typeof DEFAULT_FORM>(k: K, v: (typeof DEFAULT_FORM)[K]) =>
      setForm((f) => ({ ...f, [k]: v })),
    []
  );

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const canContinue = step === 0 ? !!form.name : true;

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepBasicInfo form={form} set={set} />;
      case 1:
        return <StepQuestionsStub />;
      case 2:
        return <StepSettingsStub />;
      case 3:
        return <StepReviewStub />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.55)] z-50 flex justify-end"
      onClick={handleOverlayClick}
    >
      <div className="w-[720px] max-w-[95vw] bg-[#1A1C1E] border-l border-[#333331] flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#333331] flex items-center justify-between flex-shrink-0">
          <div>
            <div className="font-staatliches text-[22px] tracking-[0.07em] text-[#F5F5F5]">
              CREATE ASSESSMENT
            </div>
            <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)] mt-0.5">
              // configure an adversarial assessment set
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="bg-transparent border border-[#333331] text-[rgba(245,245,245,0.42)] w-8 h-8 flex items-center justify-center rounded-[5px] cursor-pointer transition-all duration-150 hover:border-[#D32F2F] hover:text-[#D32F2F]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center px-7 py-4 border-b border-[#333331] gap-0 flex-shrink-0">
          {WIZARD_STEPS.map((s, i) => {
            const isDone = i < step;
            const isCurrent = i === step;
            return (
              <div key={s.label} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => { if (i <= step) setStep(i); }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className={`w-[26px] h-[26px] rounded-[5px] flex items-center justify-center font-jetbrains text-[11px] font-medium border flex-shrink-0 transition-all duration-200 ${
                      isDone
                        ? "bg-[rgba(56,142,60,0.2)] border-[#388E3C] text-[#66BB6A]"
                        : isCurrent
                        ? "bg-[#D32F2F] border-[#D32F2F] text-white"
                        : "border-[#333331] text-[rgba(245,245,245,0.42)]"
                    }`}
                  >
                    {isDone ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <div>
                    <div
                      className={`font-staatliches text-[13px] tracking-[0.05em] transition-colors duration-200 ${
                        isDone ? "text-[#66BB6A]" : isCurrent ? "text-[#F5F5F5]" : "text-[rgba(245,245,245,0.42)]"
                      }`}
                    >
                      {s.label}
                    </div>
                    <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.22)]">{s.sub}</div>
                  </div>
                </button>
                {i < WIZARD_STEPS.length - 1 && (
                  <div className="w-5 h-px bg-[#333331] flex-shrink-0 mx-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6
          [&::-webkit-scrollbar]:w-[3px]
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-[#333331]
          [&::-webkit-scrollbar-thumb]:rounded-full">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-[#333331] flex justify-between items-center flex-shrink-0 bg-[#1A1C1E]">
          <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)]">
            Step {step + 1} of {WIZARD_STEPS.length} — {WIZARD_STEPS[step].label}
          </div>
          <div className="flex gap-2.5">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1.5 bg-transparent text-[rgba(245,245,245,0.42)] border border-[#333331] px-3.5 py-2 font-staatliches text-sm tracking-[0.05em] rounded-[5px] cursor-pointer transition-all duration-150 hover:text-[#F5F5F5] hover:border-[rgba(245,245,245,0.3)]"
              >
                ← BACK
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 bg-transparent text-[rgba(245,245,245,0.42)] border border-[#333331] px-3.5 py-2 font-staatliches text-sm tracking-[0.05em] rounded-[5px] cursor-pointer transition-all duration-150 hover:text-[#F5F5F5] hover:border-[rgba(245,245,245,0.3)]"
            >
              SAVE DRAFT
            </button>
            {step < WIZARD_STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canContinue}
                className={`flex items-center gap-2 px-[18px] py-2 font-staatliches text-sm tracking-[0.05em] rounded-[5px] transition-colors duration-150 whitespace-nowrap ${
                  canContinue
                    ? "bg-[#D32F2F] hover:bg-[#EF5350] text-[#F5F5F5] cursor-pointer"
                    : "bg-[#333331] text-[rgba(245,245,245,0.42)] cursor-not-allowed"
                }`}
              >
                CONTINUE →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#EF5350] text-[#F5F5F5] px-[18px] py-2 font-staatliches text-sm tracking-[0.05em] rounded-[5px] cursor-pointer transition-colors duration-150 whitespace-nowrap"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                DEPLOY ASSESSMENT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}