"use client";

import { useState, useCallback } from "react";
import type { Difficulty } from "../../../../app/(admin)/types/assessment";
import type { Candidate } from "../../../../app/(admin)/types/mock-data";
import {
  MOCK_ASSESSMENTS,
  MOCK_CANDIDATES,
  ADVERSARIAL_TECHNIQUES,
  TARGET_ROLES,
  DIFFICULTY_LEVELS,
} from "../../../../app/(admin)/types/mock-data";

// ─── Tiny sub-components ───────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-9 h-5 rounded-[5px] transition-colors duration-200 flex-shrink-0 ${
        checked ? "bg-[#D32F2F]" : "bg-[#333331]"
      }`}
    >
      <span
        className={`absolute top-[3px] w-3.5 h-3.5 rounded-[3px] transition-all duration-200 ${
          checked ? "left-[19px] bg-white" : "left-[3px] bg-[rgba(245,245,245,0.42)]"
        }`}
      />
    </button>
  );
}

function TechBadge({ eff }: { eff: "HIGH" | "MED" | "LOW" }) {
  const styles = {
    HIGH: "bg-[rgba(211,47,47,0.15)] text-[#EF5350] border border-[rgba(211,47,47,0.25)]",
    MED:  "bg-[rgba(249,168,37,0.12)] text-[#FFCA28] border border-[rgba(249,168,37,0.25)]",
    LOW:  "bg-[rgba(56,142,60,0.12)] text-[#66BB6A] border border-[rgba(56,142,60,0.25)]",
  };
  return (
    <span className={`font-jetbrains text-[9px] px-[7px] py-0.5 rounded-[5px] ${styles[eff]}`}>
      {eff}
    </span>
  );
}

// ─── Shared label styles ───────────────────────────────────────────────────
const labelCls =
  "font-jetbrains text-[10px] tracking-[0.1em] text-[rgba(245,245,245,0.42)] uppercase font-medium";
const inputCls =
  "w-full bg-[#292C2F] border border-[#333331] text-[#F5F5F5] px-3.5 py-2.5 font-ibm text-[13px] rounded-[5px] outline-none transition-colors duration-150 placeholder:text-[rgba(245,245,245,0.42)] focus:border-[#D32F2F]";
const sectionTitleCls =
  "font-staatliches text-base tracking-[0.07em] text-[#F5F5F5] mb-3.5 flex items-center gap-2 after:flex-1 after:h-px after:bg-[#333331] after:content-['']";

const WIZARD_STEPS = [
  { label: "BASIC INFO",  sub: "Details & role" },
  { label: "TARGETING",   sub: "Pool & scoring" },
  { label: "SETTINGS",    sub: "Time & proctoring" },
  { label: "REVIEW",      sub: "Deploy" },
];

// ─── Step 0 — Basic Info (unchanged) ──────────────────────────────────────

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

// ─── Step 1 — Targeting (unchanged) ───────────────────────────────────────

interface TargetingForm {
  assignedCandidates: string[];
  scoringMethod: "auto" | "manual" | "hybrid";
  resultVisibility: "immediate" | "after-review" | "hidden";
  notifyOnComplete: boolean;
  techniques: string[];
}

function StepTargeting({
  form,
  toggleArr,
  set,
  targetRole,
}: {
  form: TargetingForm;
  toggleArr: (k: "assignedCandidates" | "techniques", v: string) => void;
  set: <K extends keyof TargetingForm>(k: K, v: TargetingForm[K]) => void;
  targetRole: string;
}) {
  const [refRoleFilter, setRefRoleFilter] = useState<string>("match");

  const referencePool = MOCK_ASSESSMENTS.filter((a) => {
    if (refRoleFilter === "match") return a.role === targetRole;
    if (refRoleFilter === "all") return true;
    return a.role === refRoleFilter;
  }).slice(0, 6);

  const SCORING_METHODS = [
    { key: "auto",   label: "Auto",   sub: "AI-graded in full" },
    { key: "manual", label: "Manual", sub: "Human reviewer only" },
    { key: "hybrid", label: "Hybrid", sub: "AI flags, human confirms" },
  ] as const;

  const VISIBILITY_OPTIONS = [
    { key: "immediate",    label: "Immediate",    sub: "Score shown on submit" },
    { key: "after-review", label: "After Review", sub: "Released by admin" },
    { key: "hidden",       label: "Hidden",       sub: "Internal use only" },
  ] as const;

  const statusDot: Record<Candidate["status"], string> = {
    "pending":     "bg-[rgba(245,245,245,0.28)]",
    "in-progress": "bg-[#FFCA28]",
    "completed":   "bg-[#66BB6A]",
  };

  const assignedIds = form.assignedCandidates;

  return (
    <>
      <div className="mb-6">
        <div className={sectionTitleCls}>Assign Candidates</div>
        <p className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)] mb-3 leading-relaxed">
          Select candidates to assign this assessment to. They will receive access
          once the assessment is set to <span className="text-[#66BB6A]">ACTIVE</span>.
        </p>

        <div className="flex flex-col gap-2">
          {MOCK_CANDIDATES.map((c) => {
            const assigned = assignedIds.includes(String(c.id));
            return (
              <div
                key={c.id}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-[5px] border transition-all duration-150 ${
                  assigned
                    ? "border-[rgba(211,47,47,0.35)] bg-[rgba(211,47,47,0.05)]"
                    : "border-[#333331] bg-[#292C2F]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[5px] bg-[#D32F2F] flex items-center justify-center font-staatliches text-sm text-white flex-shrink-0 select-none">
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-staatliches text-sm tracking-[0.04em] text-[#F5F5F5]">
                      {c.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)]">
                        {c.email}
                      </span>
                      <span className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.22)]">·</span>
                      <span className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)]">
                        {c.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot[c.status]}`} />
                    <span className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)] capitalize">
                      {c.status.replace("-", " ")}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleArr("assignedCandidates", String(c.id))}
                    className={`font-jetbrains text-[10px] tracking-[0.05em] px-3 py-1.5 rounded-[5px] border cursor-pointer transition-all duration-150 ${
                      assigned
                        ? "bg-[rgba(211,47,47,0.15)] border-[#D32F2F] text-[#D32F2F] hover:bg-[rgba(211,47,47,0.25)]"
                        : "bg-transparent border-[#333331] text-[rgba(245,245,245,0.42)] hover:border-[#D32F2F] hover:text-[#D32F2F]"
                    }`}
                  >
                    {assigned ? "✓ ASSIGNED" : "+ ASSIGN"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {assignedIds.length > 0 && (
          <div className="mt-2 font-jetbrains text-[9px] text-[rgba(211,47,47,0.8)] flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {assignedIds.length} candidate{assignedIds.length > 1 ? "s" : ""} will be notified when this assessment is activated.
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className={sectionTitleCls}>Assessment Pool</div>
        <p className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)] mb-3 leading-relaxed">
          Browse the existing arsenal. Filter by role to find assessments similar
          to the one you're creating — useful for benchmarking configuration.
        </p>

        <div className="flex gap-1.5 mb-3 flex-wrap">
          {[
            { key: "match", label: `Match Role (${targetRole})` },
            { key: "all",   label: "All Roles" },
            ...TARGET_ROLES.filter((r) => r !== targetRole).map((r) => ({ key: r, label: r })),
          ].slice(0, 6).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRefRoleFilter(key)}
              className={`font-jetbrains text-[9px] tracking-[0.05em] px-2.5 py-1 rounded-[5px] cursor-pointer border transition-all duration-150 uppercase ${
                refRoleFilter === key
                  ? "bg-[rgba(211,47,47,0.15)] border-[#D32F2F] text-[#D32F2F]"
                  : "bg-[#222426] border-[#333331] text-[rgba(245,245,245,0.42)] hover:border-[rgba(245,245,245,0.3)] hover:text-[#F5F5F5]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1
          [&::-webkit-scrollbar]:w-[3px]
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-[#333331]
          [&::-webkit-scrollbar-thumb]:rounded-full">
          {referencePool.length === 0 ? (
            <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.28)] text-center py-5">
              No assessments found for this filter.
            </div>
          ) : (
            referencePool.map((a) => {
              const completionPct = a.candidates > 0 ? Math.round((a.completed / a.candidates) * 100) : 0;
              const statusColours: Record<string, string> = {
                active:  "text-[#66BB6A]",
                closed:  "text-[rgba(245,245,245,0.28)]",
                pending: "text-[#FFCA28]",
                draft:   "text-[#64B5F6]",
              };
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-[5px] border border-[#333331] bg-[#292C2F]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-staatliches text-sm tracking-[0.04em] text-[#F5F5F5] truncate">
                        {a.title}
                      </div>
                      <span className={`font-jetbrains text-[8px] uppercase tracking-[0.06em] flex-shrink-0 ${statusColours[a.status]}`}>
                        {a.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      <span className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)]">{a.role}</span>
                      <span className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.22)]">·</span>
                      <span className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)]">{a.difficulty}</span>
                      <span className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.22)]">·</span>
                      <span className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)]">{a.questions} Qs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-staatliches text-[14px] leading-none text-[#F5F5F5]">
                        {completionPct}%
                      </div>
                      <div className="font-jetbrains text-[8px] text-[rgba(245,245,245,0.28)] uppercase">done</div>
                    </div>
                    {a.aiRate > 0 && (
                      <div className="text-right">
                        <div
                          className="font-staatliches text-[14px] leading-none"
                          style={{ color: a.aiRate >= 70 ? "#EF5350" : a.aiRate >= 40 ? "#FFCA28" : "#66BB6A" }}
                        >
                          {a.aiRate}%
                        </div>
                        <div className="font-jetbrains text-[8px] text-[rgba(245,245,245,0.28)] uppercase">AI</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className={sectionTitleCls}>Scoring &amp; Results</div>

        <div className="mb-4">
          <label className={`${labelCls} block mb-2`}>Scoring Method</label>
          <div className="grid grid-cols-3 gap-2">
            {SCORING_METHODS.map(({ key, label, sub }) => {
              const selected = form.scoringMethod === key;
              return (
                <button
                  key={key}
                  onClick={() => set("scoringMethod", key)}
                  className={`flex flex-col gap-1 px-3 py-2.5 rounded-[5px] border text-left cursor-pointer transition-all duration-150 ${
                    selected
                      ? "border-[#D32F2F] bg-[rgba(211,47,47,0.08)]"
                      : "border-[#333331] bg-[#292C2F] hover:border-[rgba(211,47,47,0.3)]"
                  }`}
                >
                  <div className={`font-staatliches text-sm tracking-[0.04em] transition-colors ${selected ? "text-[#D32F2F]" : "text-[#F5F5F5]"}`}>
                    {label}
                  </div>
                  <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)] leading-[1.3]">{sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <label className={`${labelCls} block mb-2`}>Result Visibility</label>
          <div className="grid grid-cols-3 gap-2">
            {VISIBILITY_OPTIONS.map(({ key, label, sub }) => {
              const selected = form.resultVisibility === key;
              return (
                <button
                  key={key}
                  onClick={() => set("resultVisibility", key)}
                  className={`flex flex-col gap-1 px-3 py-2.5 rounded-[5px] border text-left cursor-pointer transition-all duration-150 ${
                    selected
                      ? "border-[#D32F2F] bg-[rgba(211,47,47,0.08)]"
                      : "border-[#333331] bg-[#292C2F] hover:border-[rgba(211,47,47,0.3)]"
                  }`}
                >
                  <div className={`font-staatliches text-sm tracking-[0.04em] transition-colors ${selected ? "text-[#D32F2F]" : "text-[#F5F5F5]"}`}>
                    {label}
                  </div>
                  <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)] leading-[1.3]">{sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#292C2F] border border-[#333331] rounded-[5px]">
          <div>
            <div className="text-[13px] font-medium text-[#F5F5F5]">Notify Admin on Completion</div>
            <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)] mt-0.5">
              Receive an alert when each candidate submits
            </div>
          </div>
          <ToggleSwitch
            checked={form.notifyOnComplete}
            onChange={() => set("notifyOnComplete", !form.notifyOnComplete)}
          />
        </div>
      </div>

      <div className="bg-[rgba(211,47,47,0.04)] border border-[rgba(211,47,47,0.2)] rounded-[5px] p-4 mb-3.5">
        <div className="font-staatliches text-sm tracking-[0.06em] text-[#D32F2F] mb-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          ADVERSARIAL TECHNIQUES
        </div>
        <div className="flex flex-col gap-1.5">
          {ADVERSARIAL_TECHNIQUES.map((t) => {
            const active = form.techniques.includes(t.id);
            return (
              <div
                key={t.id}
                className={`flex items-center justify-between px-3 py-2 bg-[#292C2F] border rounded-[5px] transition-all ${
                  active ? "border-[rgba(211,47,47,0.35)] bg-[rgba(211,47,47,0.04)]" : "border-[#333331]"
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1">
                  <ToggleSwitch
                    checked={active}
                    onChange={() => toggleArr("techniques", t.id)}
                  />
                  <div>
                    <div className="text-[12px] font-medium text-[#F5F5F5]">{t.label}</div>
                    <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)]">{t.sub}</div>
                  </div>
                </div>
                <TechBadge eff={t.eff} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Step 2 — Settings (NEW full implementation) ─────────────────────────

interface SettingsForm {
  timeLimit: number;
  randomise: boolean;
  shuffleOptions: boolean;
}

function StepSettings({
  form,
  set,
}: {
  form: SettingsForm;
  set: <K extends keyof SettingsForm>(k: K, v: SettingsForm[K]) => void;
}) {
  const behaviourToggles = [
    { key: "randomise"      as const, label: "Randomise Question Order", desc: "Prevents candidates from sharing question sequences" },
    { key: "shuffleOptions" as const, label: "Shuffle Answer Options",   desc: "Randomises MCQ / multi-select option order" },
  ];

  return (
    <>
      {/* Time */}
      <div className="mb-6">
        <div className={sectionTitleCls}>Time Configuration</div>
        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className={labelCls}>Time Limit (minutes)</label>
              <span className="font-jetbrains text-[12px] text-[#D32F2F] font-medium">
                {form.timeLimit} min
              </span>
            </div>
            <input
              type="range" min="10" max="180" step="5"
              value={form.timeLimit}
              onChange={(e) => set("timeLimit", Number(e.target.value))}
              className="w-full h-[3px] rounded-[2px] bg-[#333331] outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-[3px] [&::-webkit-slider-thumb]:bg-[#D32F2F] [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.22)]">
              Recommended: 60–90 min for most assessments
            </div>
          </div>

          <div className="flex flex-col gap-1.5 justify-end">
            <label className={`${labelCls} block`}>Grace Period (mins)</label>
            <select
              className={`${inputCls} cursor-pointer appearance-none`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(245,245,245,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option>None</option>
              <option>2</option>
              <option>5</option>
            </select>
            <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.22)]">
              Extra time after timer hits zero
            </div>
          </div>
        </div>
      </div>

      {/* Behaviour */}
      <div className="mb-6">
        <div className={sectionTitleCls}>Behaviour</div>
        <div className="flex flex-col gap-2">
          {behaviourToggles.map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#292C2F] border border-[#333331] rounded-[5px]"
            >
              <div>
                <div className="text-[13px] font-medium text-[#F5F5F5]">{label}</div>
                <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)] mt-0.5">{desc}</div>
              </div>
              <ToggleSwitch
                checked={form[key]}
                onChange={() => set(key, !form[key])}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Candidate Access */}
      <div className="mb-6">
        <div className={sectionTitleCls}>Candidate Access</div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className={`${labelCls} block`}>Expiry Date</label>
            <input
              type="date"
              className={inputCls}
              style={{ colorScheme: "dark" }}
            />
            <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.22)]">
              Assessment becomes inactive after this date
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={`${labelCls} block`}>Passing Threshold (%)</label>
            <input
              className={inputCls}
              type="number"
              placeholder="e.g. 70"
              min="0"
              max="100"
            />
            <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.22)]">
              Minimum score to be marked as passed
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Step 3 — Review (empty stub – no text) ──────────────────────────────

function StepReviewEmpty() {
  return <div className="min-h-[200px]" />;
}

// ─── Main panel ─────────────────────────────────────────────────────────

interface CreateAssessmentPanelProps {
  onClose: () => void;
}

interface FullFormState {
  // Basic Info
  name: string;
  role: string;
  description: string;
  difficulty: Difficulty;
  // Targeting
  assignedCandidates: string[];
  scoringMethod: "auto" | "manual" | "hybrid";
  resultVisibility: "immediate" | "after-review" | "hidden";
  notifyOnComplete: boolean;
  techniques: string[];
  // Settings
  timeLimit: number;
  randomise: boolean;
  shuffleOptions: boolean;
}

const DEFAULT_FORM: FullFormState = {
  name: "",
  role: "Backend",
  description: "",
  difficulty: "Mid",
  assignedCandidates: [],
  scoringMethod: "auto",
  resultVisibility: "immediate",
  notifyOnComplete: true,
  techniques: ["misdirect", "negsemant"],
  timeLimit: 60,
  randomise: true,
  shuffleOptions: true,
};

export default function CreateAssessmentPanel({ onClose }: CreateAssessmentPanelProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULT_FORM);

  const setBasic = useCallback(
    <K extends keyof Pick<FullFormState, "name" | "role" | "description" | "difficulty">>(
      k: K,
      v: FullFormState[K]
    ) => setForm((f) => ({ ...f, [k]: v })),
    []
  );

  const setTargeting = useCallback(
    <K extends keyof Pick<FullFormState, "scoringMethod" | "resultVisibility" | "notifyOnComplete">>(
      k: K,
      v: FullFormState[K]
    ) => setForm((f) => ({ ...f, [k]: v })),
    []
  );

  const setSettings = useCallback(
    <K extends keyof Pick<FullFormState, "timeLimit" | "randomise" | "shuffleOptions">>(
      k: K,
      v: FullFormState[K]
    ) => setForm((f) => ({ ...f, [k]: v })),
    []
  );

  const toggleArr = useCallback(
    (k: "assignedCandidates" | "techniques", v: string) =>
      setForm((f) => ({
        ...f,
        [k]: (f[k] as string[]).includes(v)
          ? (f[k] as string[]).filter((x) => x !== v)
          : [...(f[k] as string[]), v],
      })),
    []
  );

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const canContinue = step === 0 ? !!form.name : true;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepBasicInfo
            form={{
              name: form.name,
              role: form.role,
              description: form.description,
              difficulty: form.difficulty,
            }}
            set={setBasic}
          />
        );
      case 1:
        return (
          <StepTargeting
            form={{
              assignedCandidates: form.assignedCandidates,
              scoringMethod: form.scoringMethod,
              resultVisibility: form.resultVisibility,
              notifyOnComplete: form.notifyOnComplete,
              techniques: form.techniques,
            }}
            toggleArr={toggleArr}
            set={setTargeting}
            targetRole={form.role}
          />
        );
      case 2:
        return (
          <StepSettings
            form={{
              timeLimit: form.timeLimit,
              randomise: form.randomise,
              shuffleOptions: form.shuffleOptions,
            }}
            set={setSettings}
          />
        );
      case 3:
        return <StepReviewEmpty />;
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