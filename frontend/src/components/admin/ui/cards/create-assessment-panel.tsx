"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  CreateAssessmentForm,
  Difficulty,
} from "../../../../app/(admin)/types/assessment";
import { TARGET_ROLES } from "../../../../app/(admin)/types/mock-data";
import { apiGet, apiPost } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { X } from "lucide-react";

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
}

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
        <div className="text-xs text-white-smoke/40 text-center py-4">
          Loading questions...
        </div>
      );
    }

    if (questionsError) {
      return (
        <div className="text-xs text-system-red text-center py-4">
          {questionsError}
        </div>
      );
    }

    return questions.map((q) => {
      const selected = selectedIds.includes(q.adv_question_id);
      const cardClassName = selected
        ? "border-system-red bg-system-red/5"
        : "border-default-border hover:border-white-smoke/30";
      const label =
        q.content.length > 80 ? `${q.content.slice(0, 80)}...` : q.content;

      return (
        <button
          type="button"
          key={q.adv_question_id}
          onClick={() => toggleQuestion(q.adv_question_id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleQuestion(q.adv_question_id);
            }
          }}
          className={`w-full text-left p-3.5 rounded-[5px] border cursor-pointer transition-all ${cardClassName}`}
        >
          <div className="flex justify-between">
            <div>
              <div className="font-medium">{label}</div>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 bg-tertiary-surface rounded">
                  Strategy #{q.strategy_id}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-tertiary-surface rounded">
                  {q.llm ?? "—"}
                </span>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded flex items-center justify-center border mt-1 ${selected ? "bg-system-red text-white" : "border-default-border"}`}
            >
              {selected && "✓"}
            </div>
          </div>
        </button>
      );
    });
  };

  //will add the other sections later
  return (
    <div
      role="button"
      tabIndex={0}
      className="fixed inset-0 bg-black/60 z-50 flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (
          (e.target === e.currentTarget && e.key === "Enter") ||
          e.key === " "
        ) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className="w-180 max-w-[95vw] bg-secondary-surface border-l border-tertiary-surface flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-7 py-5 border-b border-tertiary-surface flex items-center justify-between">
          <div>
            <div className="font-staatliches text-[22px] tracking-[0.07em] text-white-smoke">
              CREATE ASSESSMENT
            </div>
            <div className="font-ibm-plex text-[10px] text-white-smoke/40 mt-0.5">
              {" "}
              starting with the basics
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white-smoke/40 hover:text-system-red"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stepper for the wizard */}
        <div className="flex px-7 py-4 border-b border-tertiary-surface gap-1">
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

              <div className="mb-4">
                <label
                  htmlFor="questionCount"
                  className={`${labelCls} block mb-1.5`}
                >
                  Question count
                </label>
                <input
                  id="questionCount"
                  type="range"
                  min="3"
                  max="15"
                  value={formData.questionCount}
                  onChange={(e) =>
                    updateForm("questionCount", Number(e.target.value))
                  }
                  className="w-full accent-system-red"
                />
                <div className="text-right font-staatliches text-system-red text-sm mt-1">
                  {formData.questionCount} target
                </div>
              </div>

              <div className="max-h-[340px] overflow-y-auto pr-2 space-y-2">
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

        {/* Basic Footer in the meantime*/}
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
