"use client";

import { useState, useCallback } from "react";
import type { CreateAssessmentForm, Difficulty } from "../../../../app/(admin)/types/assessment";
import {
  QUESTION_TYPES,
  PROGRAMMING_LANGUAGES,
  ADVERSARIAL_TECHNIQUES,
  TARGET_ROLES,
  DIFFICULTY_LEVELS,
  WIZARD_STEPS,
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

// ─── Step 0 — Basic Info ───────────────────────────────────────────────────

function StepBasicInfo({
  form,
  set,
}: {
  form: CreateAssessmentForm;
  set: <K extends keyof CreateAssessmentForm>(k: K, v: CreateAssessmentForm[K]) => void;
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
                  onClick={() => set("difficulty", d as Difficulty)}
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

// ─── Step 1 — Questions ────────────────────────────────────────────────────

function StepQuestions({
  form,
  toggleArr,
  set,
}: {
  form: CreateAssessmentForm;
  toggleArr: (k: "questionTypes" | "languages" | "techniques", v: string) => void;
  set: <K extends keyof CreateAssessmentForm>(k: K, v: CreateAssessmentForm[K]) => void;
}) {
  return (
    <>
      {/* Question types */}
      <div className="mb-6">
        <div className={sectionTitleCls}>Question Types</div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
          {QUESTION_TYPES.map((q) => {
            const selected = form.questionTypes.includes(q.key);
            return (
              <button
                key={q.key}
                onClick={() => toggleArr("questionTypes", q.key)}
                className={`bg-[#292C2F] border rounded-[5px] p-3 text-left cursor-pointer transition-all duration-150 flex flex-col gap-1 ${
                  selected
                    ? "border-[#D32F2F] bg-[rgba(211,47,47,0.08)]"
                    : "border-[#333331] hover:border-[rgba(211,47,47,0.4)]"
                }`}
              >
                <div className="text-[18px] leading-none">{q.icon}</div>
                <div className="font-staatliches text-sm tracking-[0.05em] text-[#F5F5F5]">
                  {q.label}
                </div>
                <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)] leading-[1.3]">
                  {q.sub}
                </div>
                {/* Check indicator */}
                <div
                  className={`self-end w-3.5 h-3.5 rounded-[3px] border mt-1 flex items-center justify-center transition-all ${
                    selected ? "bg-[#D32F2F] border-[#D32F2F]" : "border-[#333331] bg-transparent"
                  }`}
                >
                  {selected && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.22)] mt-2">
          Select one or more types — questions will be sourced from the bank accordingly.
        </div>
      </div>

      {/* Languages */}
      <div className="mb-6">
        <div className={sectionTitleCls}>Programming Languages</div>
        <div className="flex flex-wrap gap-2">
          {PROGRAMMING_LANGUAGES.map((l) => {
            const selected = form.languages.includes(l);
            return (
              <button
                key={l}
                onClick={() => toggleArr("languages", l)}
                className={`font-jetbrains text-[11px] px-3.5 py-1.5 rounded-[5px] cursor-pointer border transition-all duration-150 tracking-[0.04em] ${
                  selected
                    ? "bg-[rgba(211,47,47,0.12)] border-[#D32F2F] text-[#D32F2F]"
                    : "bg-[#292C2F] border-[#333331] text-[rgba(245,245,245,0.42)] hover:border-[rgba(211,47,47,0.4)] hover:text-[#F5F5F5]"
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="mb-6">
        <div className={sectionTitleCls}>Quantity</div>
        <div className="grid grid-cols-2 gap-4 mb-3.5">
          {/* Total questions */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className={labelCls}>Total Questions</label>
              <span className="font-jetbrains text-[12px] text-[#D32F2F] font-medium">
                {form.questionCount}
              </span>
            </div>
            <input
              type="range" min="4" max="40" step="2"
              value={form.questionCount}
              onChange={(e) => set("questionCount", Number(e.target.value))}
              className="w-full h-[3px] rounded-[2px] bg-[#333331] outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-[3px] [&::-webkit-slider-thumb]:bg-[#D32F2F] [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.22)]">
              Recommended: 12–20 for 60 min sessions
            </div>
          </div>
          {/* Adversarial density */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className={labelCls}>Adversarial Density</label>
              <span className="font-jetbrains text-[12px] text-[#D32F2F] font-medium">
                {form.adversarialDensity}%
              </span>
            </div>
            <input
              type="range" min="0" max="100" step="10"
              value={form.adversarialDensity}
              onChange={(e) => set("adversarialDensity", Number(e.target.value))}
              className="w-full h-[3px] rounded-[2px] bg-[#333331] outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-[3px] [&::-webkit-slider-thumb]:bg-[#D32F2F] [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.22)]">
              % of questions with embedded AI traps
            </div>
          </div>
        </div>
      </div>

      {/* Adversarial techniques */}
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

// ─── Step 2 — Settings ─────────────────────────────────────────────────────

function StepSettings({
  form,
  set,
}: {
  form: CreateAssessmentForm;
  set: <K extends keyof CreateAssessmentForm>(k: K, v: CreateAssessmentForm[K]) => void;
}) {
  const behaviourToggles = [
    { key: "randomise"     as const, label: "Randomise Question Order",      desc: "Prevents candidates from sharing question sequences" },
    { key: "shuffleOptions"as const, label: "Shuffle Answer Options",         desc: "Randomises MCQ / multi-select option order" },
    { key: "autosave"      as const, label: "Auto-save Responses",            desc: "Saves work every 30 seconds to prevent data loss" },
    { key: "proctoring"    as const, label: "Enable Behavioural Proctoring",  desc: "Tracks keystroke dynamics, paste events, and tab switches" },
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
              Approx. {Math.round(form.timeLimit / form.questionCount)} min per question
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

      {/* Behaviour & Security */}
      <div className="mb-6">
        <div className={sectionTitleCls}>Behaviour & Security</div>
        <div className="flex flex-col gap-2">
          {behaviourToggles.map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between px-3.5 py-2.5 bg-[#292C2F] border border-[#333331] rounded-[5px]"
            >
              <div>
                <div className="text-[13px] font-medium text-[#F5F5F5]">{label}</div>
                <div className="font-jetbrains text-[9px] text-[rgba(245,245,245,0.42)] mt-0.5">
                  {desc}
                </div>
              </div>
              <ToggleSwitch
                checked={form[key] as boolean}
                onChange={() => set(key, !form[key] as CreateAssessmentForm[typeof key])}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Candidate access */}
      <div className="mb-6">
        <div className={sectionTitleCls}>Candidate Access</div>
        <div className="grid grid-cols-2 gap-3.5 mb-3.5">
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
            <label className={`${labelCls} block`}>Max Attempts Per Candidate</label>
            <select
              className={`${inputCls} cursor-pointer appearance-none`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(245,245,245,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option>1</option>
              <option>2</option>
              <option>Unlimited</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className={`${labelCls} block`}>Access Mode</label>
            <select
              className={`${inputCls} cursor-pointer appearance-none`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(245,245,245,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
            >
              <option>Invite-only (link)</option>
              <option>Open (public link)</option>
              <option>Scheduled window</option>
            </select>
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

// ─── Step 3 — Review ───────────────────────────────────────────────────────

function StepReview({ form }: { form: CreateAssessmentForm }) {
  return (
    <>
      <div className="font-staatliches text-base tracking-[0.07em] mb-3.5 flex items-center gap-2">
        CONFIGURATION SUMMARY
        <div className="flex-1 h-px bg-[#333331]" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Identity */}
        <div className="bg-[#292C2F] border border-[#333331] rounded-[5px] p-4">
          <div className="font-staatliches text-[13px] tracking-[0.06em] text-[rgba(245,245,245,0.42)] mb-2.5">IDENTITY</div>
          {([
            ["Title",        form.name || "(untitled)"],
            ["Target Role",  form.role],
            ["Difficulty",   form.difficulty],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex justify-between items-start py-1.5 border-b border-[rgba(51,51,49,0.4)] last:border-b-0">
              <span className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)]">{k}</span>
              <span className="font-ibm text-[12px] font-medium text-[#F5F5F5] text-right max-w-[55%]">{v}</span>
            </div>
          ))}
        </div>

        {/* Questions */}
        <div className="bg-[#292C2F] border border-[#333331] rounded-[5px] p-4">
          <div className="font-staatliches text-[13px] tracking-[0.06em] text-[rgba(245,245,245,0.42)] mb-2.5">QUESTIONS</div>
          {([
            ["Count",       String(form.questionCount)],
            ["Time Limit",  `${form.timeLimit} min`],
            ["AI Density",  `${form.adversarialDensity}%`],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex justify-between items-start py-1.5 border-b border-[rgba(51,51,49,0.4)] last:border-b-0">
              <span className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)]">{k}</span>
              <span className="font-ibm text-[12px] font-medium text-[#F5F5F5]">{v}</span>
            </div>
          ))}
          <div className="flex justify-between items-start py-1.5 border-b border-[rgba(51,51,49,0.4)]">
            <span className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)]">Types</span>
            <div className="flex flex-wrap gap-1 justify-end max-w-[55%]">
              {form.questionTypes.length
                ? form.questionTypes.map((t) => (
                    <span key={t} className="font-jetbrains text-[9px] px-1.5 py-0.5 bg-[#222426] border border-[#333331] rounded-[5px] text-[rgba(245,245,245,0.42)]">{t}</span>
                  ))
                : <span className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)]">none</span>}
            </div>
          </div>
          <div className="flex justify-between items-start py-1.5">
            <span className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)]">Languages</span>
            <div className="flex flex-wrap gap-1 justify-end max-w-[55%]">
              {form.languages.length
                ? form.languages.map((l) => (
                    <span key={l} className="font-jetbrains text-[9px] px-1.5 py-0.5 bg-[#222426] border border-[#333331] rounded-[5px] text-[rgba(245,245,245,0.42)]">{l}</span>
                  ))
                : <span className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)]">any</span>}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-[#292C2F] border border-[#333331] rounded-[5px] p-4">
          <div className="font-staatliches text-[13px] tracking-[0.06em] text-[rgba(245,245,245,0.42)] mb-2.5">SETTINGS</div>
          {([
            ["Randomise",    form.randomise      ? "Yes" : "No"],
            ["Auto-save",    form.autosave       ? "Yes" : "No"],
            ["Proctoring",   form.proctoring     ? "ENABLED" : "Disabled"],
            ["Shuffle Opts", form.shuffleOptions ? "Yes" : "No"],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex justify-between items-start py-1.5 border-b border-[rgba(51,51,49,0.4)] last:border-b-0">
              <span className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)]">{k}</span>
              <span className={`font-ibm text-[12px] font-medium ${v === "ENABLED" ? "text-[#EF5350]" : "text-[#F5F5F5]"}`}>{v}</span>
            </div>
          ))}
        </div>

        {/* Adversarial */}
        <div className="bg-[#292C2F] border border-[#333331] rounded-[5px] p-4">
          <div className="font-staatliches text-[13px] tracking-[0.06em] text-[rgba(245,245,245,0.42)] mb-2.5">ADVERSARIAL TECHNIQUES</div>
          {form.techniques.length
            ? form.techniques.map((id) => {
                const t = ADVERSARIAL_TECHNIQUES.find((x) => x.id === id);
                return t ? (
                  <div key={id} className="flex justify-between items-start py-1.5 border-b border-[rgba(51,51,49,0.4)] last:border-b-0">
                    <span className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)] max-w-[55%]">{t.label}</span>
                    <TechBadge eff={t.eff} />
                  </div>
                ) : null;
              })
            : <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)] py-2">No techniques selected</div>}
        </div>
      </div>

      {/* Deploy box */}
      <div className="bg-[rgba(56,142,60,0.05)] border border-[rgba(56,142,60,0.25)] rounded-[5px] px-4 py-3.5">
        <div className="font-staatliches text-sm tracking-[0.06em] text-[#66BB6A] mb-1.5">✓ READY TO DEPLOY</div>
        <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)] leading-relaxed">
          Assessment will be created as a draft and can be activated once questions are assigned from the Question Bank.
          Candidates will not have access until you set the status to{" "}
          <strong className="text-[#66BB6A]">ACTIVE</strong>.
        </div>
      </div>
    </>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────────

interface CreateAssessmentPanelProps {
  onClose: () => void;
}

const DEFAULT_FORM: CreateAssessmentForm = {
  name: "",
  role: "Backend",
  description: "",
  difficulty: "Mid",
  questionTypes: [],
  languages: [],
  questionCount: 16,
  timeLimit: 60,
  randomise: true,
  autosave: true,
  proctoring: false,
  shuffleOptions: true,
  adversarialDensity: 50,
  techniques: ["misdirect", "negsemant"],
};

export default function CreateAssessmentPanel({ onClose }: CreateAssessmentPanelProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateAssessmentForm>(DEFAULT_FORM);

  const set = useCallback(
    <K extends keyof CreateAssessmentForm>(k: K, v: CreateAssessmentForm[K]) =>
      setForm((f) => ({ ...f, [k]: v })),
    []
  );

  const toggleArr = useCallback(
    (k: "questionTypes" | "languages" | "techniques", v: string) =>
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
                  {/* Step number / check */}
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
                {/* Separator */}
                {i < WIZARD_STEPS.length - 1 && (
                  <div className="w-5 h-px bg-[#333331] flex-shrink-0 mx-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          {step === 0 && <StepBasicInfo form={form} set={set} />}
          {step === 1 && <StepQuestions form={form} toggleArr={toggleArr} set={set} />}
          {step === 2 && <StepSettings form={form} set={set} />}
          {step === 3 && <StepReview form={form} />}
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
                className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#EF5350] text-[#F5F5F5] px-[18px] py-2 font-staatliches text-sm tracking-[0.05em] rounded-[5px] cursor-pointer transition-colors duration-150 whitespace-nowrap"
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