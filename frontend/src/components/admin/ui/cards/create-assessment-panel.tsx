"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  CreateAssessmentForm,
  Difficulty,
} from "../../../../app/(admin)/types/assessment";
import { TARGET_ROLES } from "../../../../app/(admin)/types/mock-data";
import { apiGet, apiPost } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { X, Search, Check } from "lucide-react";

const labelCls =
  "font-ibm-plex text-[10px] tracking-[0.1em] text-white-smoke/40 uppercase font-medium";
const inputCls =
  "w-full bg-secondary-surface border border-default-border text-white-smoke px-3.5 py-2.5 font-ibm text-[13px] rounded-[5px] outline-none transition-colors duration-150 placeholder:text-white-smoke/40 focus:border-system-red";
const sectionTitleCls =
  "font-staatliches text-base tracking-[0.07em] text-white-smoke mb-3.5 flex items-center gap-2 after:flex-1 after:h-px after:bg-default-border after:content-['']";

interface Props {
  readonly onClose: () => void;
  readonly onCreated?: () => void | Promise<void>;
}

interface CreatedAssessment {
  assessment_id: number;
  title: string;
  description: string | null;
  duration_mins: number;
  creator_id: number;
  status: string;
  created_at: string;
}
interface AdversarialQuestionOption {
  adv_question_id: number;
  source_question_id: number;
  content: string;
  strategy_id: number;
  llm: string | null;
  generated_at: string;
  pattern_used?: string | null;
  validation_status: string;
}

type FilterValue = string | "all";

const DEFAULT_FORM: CreateAssessmentForm = {
  name: "",
  role: "Backend",
  description: "",
  difficulty: "Medium" as Difficulty,
  questionCount: 8,
  timeLimit: 60,
  assignedCandidates: [],
  scoringMethod: "auto",
  resultVisibility: "immediate",
  notifyOnComplete: true,
  questionTypes: [],
  languages: [],
  randomise: true,
  autosave: true,
  proctoring: false,
  shuffleOptions: true,
  adversarialDensity: 50,
  techniques: [],
};

export default function CreateAssessmentPanel({ onClose, onCreated }: Props) {
  const [step, setStep] = useState(0); //more steps coming later, only 1 for now
  const [formData, setFormData] = useState<CreateAssessmentForm>(DEFAULT_FORM);
  const [selectedIds, setSelectedIds] = useState<number[]>([]); //this tracks the selected question
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AdversarialQuestionOption[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [questionSearch, setQuestionSearch] = useState("");
  const [patternFilter, setPatternFilter] = useState<FilterValue>("all");
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");

  const updateForm = useCallback(
    <K extends keyof CreateAssessmentForm>(
      key: K,
      value: CreateAssessmentForm[K],
    ) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;
    const loadQuestions = async () => {
      setQuestionsLoading(true);
      setQuestionsError(null);
      try {
        const response = await apiGet<AdversarialQuestionOption[]>(
          "/api/v1/adversarial-questions",
          { headers: getAuthHeaders() },
        );
        if (isMounted) setQuestions(response);
      } catch (err) {
        if (isMounted) {
          setQuestionsError(
            err instanceof Error ? err.message : "Failed to load questions.",
          );
        }
      } finally {
        if (isMounted) setQuestionsLoading(false);
      }
    };
    void loadQuestions();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isCreating) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isCreating, onClose]);

  const patternOptions = useMemo(() => {
  const unique = new Set<string>();
  questions.forEach((q) => {
    if (q.pattern_used) unique.add(q.pattern_used);
  });
  return Array.from(unique).sort();
}, [questions]);

const statusOptions = useMemo(() => {
  const unique = new Set<string>();
  questions.forEach((q) => {
    if (q.validation_status) unique.add(q.validation_status);
  });
  return Array.from(unique).sort();
}, [questions]);

const filteredQuestions = useMemo(() => {
  const q = questionSearch.trim().toLowerCase();
  return questions.filter((item) => {
    const matchesSearch = !q || item.content.toLowerCase().includes(q);
    const matchesPattern =
      patternFilter === "all" || item.pattern_used === patternFilter;
    const matchesStatus =
      statusFilter === "all" || item.validation_status === statusFilter;
    return matchesSearch && matchesPattern && matchesStatus;
  });
}, [questions, questionSearch, patternFilter, statusFilter]);

const allFilteredSelected =
  filteredQuestions.length > 0 &&
  filteredQuestions.every((q) => selectedIds.includes(q.adv_question_id));

  const toggleSelectAllFiltered = () => {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (allFilteredSelected) {
      filteredQuestions.forEach((q) => next.delete(q.adv_question_id));
    } else {
      filteredQuestions.forEach((q) => next.add(q.adv_question_id));
    }
    return Array.from(next);
  });
};

  const toggleQuestion = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const createIt = async () => {
    setCreateError(null);
    setIsCreating(true);

    let createdAssessmentId: number;
    try {
      const created = await apiPost<CreatedAssessment>(
        "/api/v1/assessments",
        {
          title: formData.name,
          description: formData.description,
          duration_mins: formData.timeLimit,
        },
        { headers: getAuthHeaders() },
      );
      createdAssessmentId = created.assessment_id;
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create assessment.",
      );
      setIsCreating(false);
      return;
    }

    for (const advQuestionId of selectedIds) {
      try {
        await apiPost(
          `/api/v1/assessments/${createdAssessmentId}/questions`,
          { adv_question_id: advQuestionId },
          { headers: getAuthHeaders() },
        );
      } catch {}
    }

    for (const candidateId of formData.assignedCandidates) {
      try {
        await apiPost(
          `/api/v1/assessments/${createdAssessmentId}/invite`,
          { candidate_id: Number(candidateId) },
          { headers: getAuthHeaders() },
        );
      } catch {}
    }

    setIsCreating(false);
    await onCreated?.();
    onClose();
  };

  const renderQuestionsList = () => {
  if (questionsLoading) {
    return (
      <div className="flex items-center justify-center py-16 font-jetbrains text-[12px] text-white-smoke/40">
        Loading questions...
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="flex items-center justify-center py-16 font-jetbrains text-[12px] text-system-red">
        {questionsError}
      </div>
    );
  }

  if (filteredQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="font-staatliches text-[18px] tracking-[0.06em] text-[rgba(245,245,245,0.22)] mb-1.5">
          NO QUESTIONS FOUND
        </div>
        <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.22)]">
          Try adjusting your search or filters.
        </div>
      </div>
    );
  }

  return filteredQuestions.map((q) => {
    const selected = selectedIds.includes(q.adv_question_id);
    const label =
      q.content.length > 90 ? `${q.content.slice(0, 90)}...` : q.content;

    return (
      <label
        key={q.adv_question_id}
        className={`flex items-start gap-3 px-3.5 py-3 rounded-[5px] border transition-colors duration-150 cursor-pointer ${
          selected
            ? "border-system-red bg-system-red/5"
            : "border-default-border hover:bg-tertiary-surface"
        }`}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => toggleQuestion(q.adv_question_id)}
          className="h-3.5 w-3.5 mt-0.5 cursor-pointer accent-system-red shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="font-staatliches text-[13px] tracking-[0.04em] text-white-smoke truncate">
            {label}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className="font-jetbrains text-[9px] px-2 py-0.5 bg-tertiary-surface rounded uppercase tracking-wide text-white-smoke/60">
              {q.pattern_used ?? "—"}
            </span>
            <span className="font-jetbrains text-[9px] px-2 py-0.5 bg-tertiary-surface rounded uppercase tracking-wide text-white-smoke/60">
              {q.validation_status}
            </span>
            <span className="font-jetbrains text-[9px] px-2 py-0.5 bg-tertiary-surface rounded uppercase tracking-wide text-white-smoke/60">
              Strategy #{q.strategy_id}
            </span>
            <span className="font-jetbrains text-[9px] px-2 py-0.5 bg-tertiary-surface rounded uppercase tracking-wide text-white-smoke/60">
              {q.llm ?? "—"}
            </span>
          </div>
        </div>
        {selected && (
          <Check size={15} className="text-system-red mt-0.5 shrink-0" />
        )}
      </label>
    );
  });
};


  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
    <button
      type="button"
      aria-label="Close"
      onClick={() => !isCreating && onClose()}
      className="absolute inset-0 cursor-default"
    />
    <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-secondary-surface border border-tertiary-surface rounded-[6px] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.65)]">
          {/* Header */}
          <div className="px-7 py-5 border-b border-tertiary-surface flex items-center justify-between">
            <div>
              <div className="font-staatliches text-[26px] tracking-[0.07em] leading-none text-white-smoke">
                CREATE ASSESSMENT
              </div>
              <div className="font-jetbrains text-[10px] text-white-smoke/40 mt-1.5">
                create and configure an adversarial assessment
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="text-white-smoke/40 hover:text-system-red transition-colors duration-150 cursor-pointer shrink-0">
              <X size={22} />
            </button>
          </div>

          {/* Stepper for the wizard */}
          <div className="flex px-7 py-4 border-b border-tertiary-surface gap-1 shrink-0">
            {[
              { id: 0, label: "Basic", sub: "details" },
              { id: 1, label: "Questions", sub: "select" },
              { id: 2, label: "Confirm", sub: "final" },
            ].map((s) => {
              let stepCircleClass = "border-default-border text-default-border";

              if (s.id < step) {
                stepCircleClass = "bg-status-success-dim text-status-success";
              } else if (s.id === step) {
                stepCircleClass = "bg-default-text text-black";
              }

              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => s.id <= step && setStep(s.id)}
                  className={`flex-1 flex items-center gap-3 ${s.id > step ? "opacity-40" : ""}`}
                >
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center border ${stepCircleClass}`}
                  >
                    {s.id < step ? "✓" : s.id + 1}
                  </div>
                  <div>
                    <div
                      className={`font-staatliches text-sm ${s.id === step ? "" : "text-white-smoke/60"}`}
                    >
                      {s.label}
                    </div>
                    <div className="text-[9px] text-white-smoke/30">{s.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-7 py-6">
            {/*Section 1*/}
            {step === 0 && (
              <div className="mb-6">
                <div className={sectionTitleCls}>Assessment Identity</div>

                <div className="mb-3.5">
                  <label htmlFor="title" className={`${labelCls} block mb-1.5`}>
                    Title *
                  </label>
                  <input
                    id="title"
                    className={inputCls}
                    placeholder="Senior Backend Algorithm Sprint"
                    value={formData.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                  />
                </div>

                <div className="mb-3.5">
                  <label
                    htmlFor="description"
                    className={`${labelCls} block mb-1.5`}
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    className={`${inputCls} resize-y min-h-20 leading-relaxed`}
                    placeholder="Briefly describe the purpose..."
                    value={formData.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="role" className={`${labelCls} block mb-1.5`}>
                      Target Role
                    </label>
                    <select
                      id="role"
                      className={`${inputCls} cursor-pointer appearance-none`}
                      value={formData.role}
                      onChange={(e) => updateForm("role", e.target.value)}
                    >
                      {TARGET_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="timeLimit"
                      className={`${labelCls} block mb-1.5`}
                    >
                      Time Limit (min)
                    </label>
                    <input
                      id="timeLimit"
                      type="number"
                      min="15"
                      max="180"
                      className={inputCls}
                      value={formData.timeLimit}
                      onChange={(e) =>
                        updateForm("timeLimit", Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Section 2 */}
            {step === 1 && (
  <div className="mb-6">
    <div className={sectionTitleCls}>Pick Questions</div>

    {/* Search + filters */}
    <div className="flex items-center gap-2.5 flex-wrap mb-3">
      <div className="relative flex-1 min-w-50">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white-smoke/40"
          size={14}
        />
        <input
          placeholder="Search questions..."
          value={questionSearch}
          onChange={(e) => setQuestionSearch(e.target.value)}
          className="w-full bg-background border border-default-border text-default-text pl-9 pr-3 py-2 font-jetbrains text-[11px] tracking-[0.04em] rounded-[5px] outline-none placeholder:text-white-smoke/40 transition-colors duration-150 hover:bg-tertiary-surface focus:border-system-red focus:bg-background"
        />
      </div>
    </div>

    {patternOptions.length > 0 && (
      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        <span className="font-jetbrains text-[9px] tracking-[0.06em] uppercase text-white-smoke/30 mr-1">
          Pattern
        </span>
        <button
          type="button"
          onClick={() => setPatternFilter("all")}
          className={`font-jetbrains text-[10px] tracking-wider px-3 py-1.25 rounded-[5px] cursor-pointer border transition-all duration-150 uppercase ${
            patternFilter === "all"
              ? "bg-system-red/15 border-system-red text-system-red"
              : "bg-background border-default-border text-default-text hover:bg-tertiary-surface"
          }`}
        >
          All
        </button>
        {patternOptions.map((p) => (
          <button
            type="button"
            key={p}
            onClick={() => setPatternFilter(p)}
            className={`font-jetbrains text-[10px] tracking-wider px-3 py-1.25 rounded-[5px] cursor-pointer border transition-all duration-150 uppercase ${
              patternFilter === p
                ? "bg-system-red/15 border-system-red text-system-red"
                : "bg-background border-default-border text-default-text hover:bg-tertiary-surface"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    )}

    {statusOptions.length > 0 && (
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <span className="font-jetbrains text-[9px] tracking-[0.06em] uppercase text-white-smoke/30 mr-1">
          Status
        </span>
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`font-jetbrains text-[10px] tracking-wider px-3 py-1.25 rounded-[5px] cursor-pointer border transition-all duration-150 uppercase ${
            statusFilter === "all"
              ? "bg-system-red/15 border-system-red text-system-red"
              : "bg-background border-default-border text-default-text hover:bg-tertiary-surface"
          }`}
        >
          All
        </button>
        {statusOptions.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`font-jetbrains text-[10px] tracking-wider px-3 py-1.25 rounded-[5px] cursor-pointer border transition-all duration-150 uppercase ${
              statusFilter === s
                ? "bg-system-red/15 border-system-red text-system-red"
                : "bg-background border-default-border text-default-text hover:bg-tertiary-surface"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    )}

    <div className="flex items-center justify-between mb-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={allFilteredSelected}
          onChange={toggleSelectAllFiltered}
          className="h-3.5 w-3.5 cursor-pointer accent-system-red"
        />
        <span className="font-jetbrains text-[9px] tracking-[0.06em] uppercase text-white-smoke/40">
          Select all ({filteredQuestions.length})
        </span>
      </label>
      <div className="font-jetbrains text-[9px] tracking-[0.06em] uppercase text-white-smoke/40">
        {selectedIds.length} selected
      </div>
    </div>

    <div className="max-h-[360px] overflow-y-auto pr-2 space-y-2">
      {renderQuestionsList()}
    </div>
  </div>
)}

            {/* Section 3 */}
            {step === 2 && (
              <div>
                <div className="font-staatliches text-base tracking-[0.07em] mb-4 flex items-center gap-2">
                  READY TO GO
                  <div className="flex-1 h-px bg-default-border" />
                </div>
                <div className="bg-secondary-surface border border-default-border rounded-[5px] p-4 space-y-2 text-sm">
                  <div>
                    <span className="text-white-smoke/60">Title:</span>{" "}
                    {formData.name || "Unititled"}
                  </div>
                  <div>
                    <span className="text-white-smoke/60">Role:</span>{" "}
                    {formData.role}
                  </div>
                  <div>
                    <span className="text-white-smoke/60">Time:</span>{" "}
                    {formData.timeLimit} min
                  </div>
                  <div>
                    <span className="text-white-smoke/60">Questions:</span>{" "}
                    {selectedIds.length} (target {formData.questionCount})
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Basic Footer*/}
          <div className="px-7 py-4 border-t border-tertiary-surface flex flex-col gap-3 bg-secondary-surface">
            {createError && (
              <div className="font-ibm-plex text-[12px] text-system-red">
                {createError}
              </div>
            )}
            <div className="flex justify-end">
              <div className="font-ibm-plex text-[12px] text-white-smoke/40 mr-auto">
                {" "}
                Step {step + 1}/3
              </div>
              <div className="flex gap-3">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="px-5 py-2 border border-default-border hover:text-white-smoke rounded-[5px] font-staatliches text-sm"
                  >
                    BACK
                  </button>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    className="px-8 py-2 bg-default-text text-background font-staatliches rounded-[5px] hover:bg-white"
                  >
                    CONTINUE
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={createIt}
                    disabled={isCreating}
                    className="px-8 py-2 bg-default-text text-background font-staatliches rounded-[5px] hover:bg-white disabled:opacity-50"
                  >
                    {isCreating ? "CREATING..." : "CREATE ASSESSMENT"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
}
