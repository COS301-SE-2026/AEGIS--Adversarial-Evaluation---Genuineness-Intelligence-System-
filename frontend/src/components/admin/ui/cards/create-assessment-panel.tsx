"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { MouseEvent } from "react";
import type {
  CreateAssessmentForm,
  Difficulty,
} from "../../../../app/(admin)/types/assessment";
import { TARGET_ROLES } from "../../../../app/(admin)/types/mock-data";
import { apiGet, apiPost } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { X, Search, Check, Info } from "lucide-react";
import QuestionContentModal from "./question-content-modal";

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
  source_question_title?: string | null;
  content: string;
  strategy_id: number;
  llm: string | null;
  generated_at: string;
  pattern_used?: string | null;
  validation_status: string;
}

type EvidenceStatus =
  | "available"
  | "insufficient_data"
  | "failed"
  | "not_available";

type IntegrityDecision = "accept" | "modify" | "reject";

interface IntegrityWeightRecommendation {
  adv_question_id: number;
  recruiter_weight: number | null;
  ai_suggested_weight: number | null;
  recommendation_status: "pending" | "insufficient_data" | "failed";
  ai_recommendation: string | null;
  ai_generated_at: string | null;
  evidence_status: EvidenceStatus;
  historical_sample_size: number;
  failure_details: string | null;
}

interface IntegrityWeightRecommendationsResponse {
  recommendation_id: string;
  recommendations: IntegrityWeightRecommendation[];
}

interface IntegrityWeightDecisionsResponse {
  recommendation_id: string;
  approved_weights: Array<{
    adv_question_id: number;
    approved_weight: number | null;
    decision: IntegrityDecision;
  }>;
  total_approved_weight: number;
  ready_for_assessment_creation: boolean;
}

const EVIDENCE_LABEL: Record<EvidenceStatus, string> = {
  available: "Sufficient data",
  insufficient_data: "Insufficient data",
  failed: "Unavailable",
  not_available: "Unavailable",
};

const EVIDENCE_STYLE: Record<EvidenceStatus, string> = {
  available: "text-status-success border-status-success-dim bg-status-success-dim/10",
  insufficient_data: "text-white-smoke/50 border-default-border bg-tertiary-surface",
  failed: "text-status-warning border-status-warning/40 bg-status-warning/10",
  not_available: "text-white-smoke/40 border-default-border bg-tertiary-surface",
};

//type FilterValue = string;

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

function getQuestionTitle(question: AdversarialQuestionOption): string {
  return question.source_question_title ?? `Question #${question.adv_question_id}`;
}

interface QuestionCardProps {
  readonly question: AdversarialQuestionOption;
  readonly selected: boolean;
  readonly onToggle: (id: number) => void;
  readonly onOpen: (question: AdversarialQuestionOption) => void;
}

function QuestionCard({ question, selected, onToggle, onOpen }: QuestionCardProps) {
  function handleToggle() {
    onToggle(question.adv_question_id);
  }

  function handleInfoClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    onOpen(question);
  }

  return (
    <label
      className={`flex items-center gap-3 pl-3.5 pr-2 py-2.5 rounded-[5px] border transition-colors duration-150 cursor-pointer ${
        selected
          ? "border-system-red bg-system-red/5"
          : "border-default-border hover:bg-code-editor"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={handleToggle}
        className="h-3.5 w-3.5 cursor-pointer accent-system-red shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="font-staatliches text-[13px] tracking-[0.04em] text-white-smoke truncate">
          {getQuestionTitle(question)}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <span className="font-jetbrains text-[9px] px-2 py-0.5 bg-tertiary-surface rounded uppercase tracking-wide text-white-smoke/60">
            {question.pattern_used ?? "—"}
          </span>
        </div>
      </div>
      {selected && (
        <Check size={15} className="text-system-red shrink-0" />
      )}
      <button
        type="button"
        onClick={handleInfoClick}
        aria-label={`View full question: ${getQuestionTitle(question)}`}
        title="View full question"
        className="w-8 h-8 flex items-center justify-center rounded-[5px] text-white-smoke/40 hover:text-white-smoke hover:bg-tertiary-surface transition-colors duration-150 cursor-pointer shrink-0"
      >
        <Info size={16} />
      </button>
    </label>
  );
}


export default function CreateAssessmentPanel({ onClose, onCreated }: Props) {
  const [step, setStep] = useState(0); 
  const [formData, setFormData] = useState<CreateAssessmentForm>(DEFAULT_FORM);
  const [selectedIds, setSelectedIds] = useState<number[]>([]); //this tracks the selected question
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AdversarialQuestionOption[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [questionSearch, setQuestionSearch] = useState("");
  const [patternFilter, setPatternFilter] = useState<string>("all");
  const [activeQuestion, setActiveQuestion] = useState<AdversarialQuestionOption | null>(null);  const [recommendations, setRecommendations] = useState<Record<string, IntegrityWeightRecommendation>>({});
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [recruiterWeights, setRecruiterWeights] = useState<Record<string, number | null>>({});
  const [approvedWeights, setApprovedWeights] = useState<Record<string, number>>({});
  const [weightDecisions, setWeightDecisions] = useState<Record<string, IntegrityDecision>>({});
  const [weightsLoading, setWeightsLoading] = useState(false);
  const [weightsError, setWeightsError] = useState<string | null>(null);

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
  const controller = new AbortController();
  if (step !== 2 || selectedIds.length === 0) {
    return () => controller.abort();
  }

  const selectedQuestionIds = [...selectedIds];
  const baseline = Object.fromEntries(
    selectedQuestionIds.map((id) => [String(id), 1 / selectedQuestionIds.length]),
  ) as Record<string, number>;

  const loadRecommendations = async () => {
    if (controller.signal.aborted) return;
    setWeightsLoading(true);
    setWeightsError(null);
    setRecommendationId(null);
    setRecommendations({});
    setRecruiterWeights(baseline);
    setApprovedWeights(baseline);
    setWeightDecisions({});
    try {
      const response = await apiPost<IntegrityWeightRecommendationsResponse>(
        "/api/v1/integrity-weights/recommendations",
        {
          questions: selectedQuestionIds.map((advQuestionId) => ({
            adv_question_id: advQuestionId,
            recruiter_weight: baseline[String(advQuestionId)],
          })),
        },
        { headers: getAuthHeaders(), signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      setRecommendationId(response.recommendation_id);
      setRecommendations(
        Object.fromEntries(
          response.recommendations.map((recommendation) => [
            String(recommendation.adv_question_id),
            recommendation,
          ]),
        ),
      );
      setApprovedWeights((current) => ({
        ...current,
        ...Object.fromEntries(
          response.recommendations
            .filter((recommendation) => recommendation.recruiter_weight !== null)
            .map((recommendation) => [
              String(recommendation.adv_question_id),
              recommendation.recruiter_weight as number,
            ]),
        ),
      }));
    } catch (err) {
      if (controller.signal.aborted) return;
      setWeightsError(
        err instanceof Error ? err.message : "Failed to load recommendations.",
      );
    } finally {
      if (!controller.signal.aborted) setWeightsLoading(false);
    }
  };

  const requestTimer = window.setTimeout(() => {
    void loadRecommendations();
  }, 300);

  return () => {
    window.clearTimeout(requestTimer);
    controller.abort();
  };
}, [step, selectedIds]);

  function registerEscapeListener() {
    if (isCreating || activeQuestion !== null) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function removeEscapeListener() {
      document.removeEventListener("keydown", handleEscape);
    }
    document.addEventListener("keydown", handleEscape);
    return removeEscapeListener;
  }

  useEffect(registerEscapeListener, [isCreating, onClose, activeQuestion]);

  const patternOptions = useMemo(() => {
  const unique = new Set<string>();
  questions.forEach((q) => {
    if (q.pattern_used) unique.add(q.pattern_used);
  });
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}, [questions]);


const filteredQuestions = useMemo(() => {
  const q = questionSearch.trim().toLowerCase();
  return questions.filter((item) => {
    const matchesSearch =
      !q ||
      getQuestionTitle(item).toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q);
    const matchesPattern =
      patternFilter === "all" || item.pattern_used === patternFilter;
    return matchesSearch && matchesPattern;
  });
}, [questions, questionSearch, patternFilter]);

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

  function handleOpenQuestion(question: AdversarialQuestionOption) {
    setActiveQuestion(question);
  }

  function handleCloseQuestion() {
    setActiveQuestion(null);
  }
  
  const handleWeightChange = (questionId: string, value: number) => {
  setApprovedWeights((prev) => ({ ...prev, [questionId]: value }));
  setWeightDecisions((prev) => ({ ...prev, [questionId]: "modify" }));
};

const handleAcceptSuggestion = (rec: IntegrityWeightRecommendation) => {
  if (rec.ai_suggested_weight === null) return;
  const key = String(rec.adv_question_id);
  setApprovedWeights((prev) => ({ ...prev, [key]: rec.ai_suggested_weight as number }));
  setWeightDecisions((prev) => ({ ...prev, [key]: "accept" }));
};

const handleRejectSuggestion = (questionId: string) => {
  setWeightDecisions((prev) => ({ ...prev, [questionId]: "reject" }));
};

  const handleContinue = () => {
    if (step === 2) {
      const weights = selectedIds.map(
        (questionId) => approvedWeights[String(questionId)],
      );
      const totalWeight = weights.reduce(
        (total, weight) => total + (weight ?? 0),
        0,
      );
      const hasInvalidWeight = weights.some(
        (weight) => weight === undefined || !Number.isFinite(weight) || weight < 0 || weight > 1,
      );

      if (hasInvalidWeight || Math.abs(totalWeight - 1) > 0.000001) {
        setCreateError(
          `Approved weights must add up to 1. Current total: ${totalWeight.toFixed(2)}.`,
        );
        return;
      }
    }

    setCreateError(null);
    setStep((currentStep) => currentStep + 1);
  };

  const createIt = async () => {
    setCreateError(null);
    setIsCreating(true);

    if (!recommendationId) {
      setCreateError("Integrity recommendations are not ready yet.");
      setIsCreating(false);
      return;
    }

    const missingDecisions = selectedIds.filter(
      (questionId) => !weightDecisions[String(questionId)],
    );
    if (missingDecisions.length > 0) {
      setCreateError(
        "Choose accept or reject for every selected question.",
      );
      setIsCreating(false);
      return;
    }

    let approvedResults: IntegrityWeightDecisionsResponse["approved_weights"];
    try {
      const decisionResponse = await apiPost<IntegrityWeightDecisionsResponse>(
        "/api/v1/integrity-weights/decisions",
        {
          recommendation_id: recommendationId,
          decisions: selectedIds.map((advQuestionId) => {
            const decision = weightDecisions[String(advQuestionId)];
            return {
              adv_question_id: advQuestionId,
              decision,
              ...(decision === "modify"
                ? { approved_weight: approvedWeights[String(advQuestionId)] }
                : {}),
            };
          }),
        },
        { headers: getAuthHeaders() },
      );
      approvedResults = decisionResponse.approved_weights;
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to save weight decisions.",
      );
      setIsCreating(false);
      return;
    }

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

    for (const approved of approvedResults) {
      try {
        await apiPost(
          `/api/v1/assessments/${createdAssessmentId}/questions`,
          {
            adv_question_id: approved.adv_question_id,
            recommendation_id: recommendationId,
          },
          { headers: getAuthHeaders() },
        );
      } catch (err) {
        setCreateError(
          err instanceof Error
            ? `Failed to add question ${approved.adv_question_id}: ${err.message}`
            : `Failed to add question ${approved.adv_question_id}.`,
        );
        setIsCreating(false);
        return;
      }
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

  function renderQuestionCard(q: AdversarialQuestionOption) {
    return (
      <QuestionCard
        key={q.adv_question_id}
        question={q}
        selected={selectedIds.includes(q.adv_question_id)}
        onToggle={toggleQuestion}
        onOpen={handleOpenQuestion}
      />
    );
  }

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

  return filteredQuestions.map(renderQuestionCard);
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
              { id: 2, label: "Weighting", sub: "integrity" },
              { id: 3, label: "Confirm", sub: "final" },
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
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
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

{step === 2 && (
  <div className="mb-6">
    <div className={sectionTitleCls}>Integrity Weighting</div>
    <div className="font-jetbrains text-[10px] text-white-smoke/40 mb-4 leading-relaxed">
      Set the approved integrity weight for each question. AI suggestions are
      reference only — accepting, editing, or rejecting is always an explicit
      action and never changes the approved weight on its own.
    </div>

    {weightsLoading && (
      <div className="flex items-center justify-center py-10 font-jetbrains text-[12px] text-white-smoke/40">
        Loading recommendations...
      </div>
    )}

    {weightsError && (
      <div className="mb-3 font-jetbrains text-[10px] text-status-warning">
        Recommendations unavailable ({weightsError}) — weights default to 0.5 and can still be set manually.
      </div>
    )}

    {!weightsLoading && selectedIds.length === 0 && (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="font-staatliches text-[18px] tracking-[0.06em] text-[rgba(245,245,245,0.22)] mb-1.5">
          NO QUESTIONS SELECTED
        </div>
        <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.22)]">
          Go back and select at least one question to configure weighting.
        </div>
      </div>
    )}

    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
      {selectedIds.map((rawId) => {
        const id = String(rawId);
        const question = questions.find((q) => q.adv_question_id === rawId);
        const rec = recommendations[id];
        const approved = approvedWeights[id] ?? recruiterWeights[id] ?? 0;
        const decision = weightDecisions[id];
        const label = question
          ? question.content.length > 90
            ? `${question.content.slice(0, 90)}...`
            : question.content
          : `Question #${id}`;

        return (
          <div key={id} className="border border-default-border rounded-[5px] px-4 py-3.5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="font-staatliches text-[13px] tracking-[0.04em] text-white-smoke min-w-0 truncate">
                {label}
              </div>
              {rec && (
                <span
                  className={`shrink-0 font-jetbrains text-[9px] px-2 py-0.5 rounded border uppercase tracking-wide ${EVIDENCE_STYLE[rec.evidence_status]}`}
                >
                  {EVIDENCE_LABEL[rec.evidence_status]}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className={`${labelCls} block mb-1.5`}>Approved Weight</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={approved}
                  onChange={(e) =>
                    handleWeightChange(id, Math.min(1, Math.max(0, Number(e.target.value))))
                  }
                  className={inputCls}
                />
                {decision && (
                  <div
                    className={`mt-1.5 font-jetbrains text-[9px] uppercase tracking-wide ${
                      decision === "reject" ? "text-white-smoke/40" : "text-status-success"
                    }`}
                  >
                    {decision === "accept"
                      ? "Suggestion accepted"
                      : decision === "modify"
                      ? "Manually set"
                      : "Suggestion rejected"}
                  </div>
                )}
              </div>

              <div>
                <label className={`${labelCls} block mb-1.5`}>AI Suggested Weight</label>
                {rec?.ai_suggested_weight !== null && rec?.ai_suggested_weight !== undefined ? (
                  <>
                    <div className="bg-tertiary-surface border border-default-border rounded-[5px] px-3.5 py-2.5 font-ibm text-[13px] text-white-smoke/80">
                      {rec.ai_suggested_weight.toFixed(2)}
                    </div>
                    {rec.ai_recommendation && (
                      <div className="mt-1.5 font-jetbrains text-[9px] text-white-smoke/40 leading-relaxed">
                        {rec.ai_recommendation}
                      </div>
                    )}
                    <div className="flex gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptSuggestion(rec)}
                        className={`font-jetbrains text-[9px] tracking-wider px-2.5 py-1 rounded-[5px] cursor-pointer border uppercase transition-colors duration-150 ${
                          decision === "accept"
                            ? "bg-status-success-dim/20 border-status-success text-status-success"
                            : "bg-background border-default-border text-default-text hover:bg-tertiary-surface"
                        }`}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectSuggestion(id)}
                        className={`font-jetbrains text-[9px] tracking-wider px-2.5 py-1 rounded-[5px] cursor-pointer border uppercase transition-colors duration-150 ${
                          decision === "reject"
                            ? "bg-system-red/15 border-system-red text-system-red"
                            : "bg-background border-default-border text-default-text hover:bg-tertiary-surface"
                        }`}
                      >
                        Reject
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-tertiary-surface border border-default-border rounded-[5px] px-3.5 py-2.5 font-jetbrains text-[10px] text-white-smoke/40">
                    No recommendation — {rec ? EVIDENCE_LABEL[rec.evidence_status].toLowerCase() : "not yet loaded"}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

            {/* Section 3 */}
            {step === 3 && (
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
                   <div>
                    <span className="text-white-smoke/60">Integrity weights:</span>{" "}
                    {selectedIds.filter((id) => weightDecisions[String(id)] === "accept").length} accepted,{" "}
                    {selectedIds.filter((id) => weightDecisions[String(id)] === "modify").length} modified,{" "}
                    {selectedIds.filter((id) => weightDecisions[String(id)] === "reject").length} rejected
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
                Step {step + 1}/4
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
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleContinue}
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
        {activeQuestion && (
          <QuestionContentModal
            title={getQuestionTitle(activeQuestion)}
            pattern={activeQuestion.pattern_used}
            content={activeQuestion.content}
            onClose={handleCloseQuestion}
          />
        )}
      </div>
    
  );
}
