"use client"

import { useEffect, useState } from "react";
import { X, RefreshCw, Sparkles } from "lucide-react";
import { QuestionBank, QuestionCategory, QuestionPayload } from "../../types/questions";
import { apiGet, apiPost } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";


interface AdversarialStrategy {
    strategy_id: number;
    strategy_name: string;
    description: string | null;
    trap_mechanism_summary: string | null;
}

interface GeneratedAdversarialQuestion {
    adv_question_id: number;
    source_question_id: number;
    content: string;
    strategy_id: number;
    llm: string | null;
    generated_at: string;
}

interface AdversarialQuestionModalProps {
    isOpen: boolean;
    mode: "create" | "edit"
    question_id?: number | null;
    questions: QuestionBank[];
    categories: QuestionCategory[];
    onClose: () => void;
    onSubmit: (payload: QuestionPayload) => void;
    isSaving?: boolean;
}

export default function AdversarialQuestionModal({isOpen, onClose, questions, categories, onSubmit, isSaving = false, mode, question_id}: AdversarialQuestionModalProps) {
    const [sourceQuestionId, setSourceQuestionId] = useState<number | null>(null);
    const [strategyId, setStrategyId] = useState<number | null>(null);
    const [strategies, setStrategies] = useState<AdversarialStrategy[]>([]);
    const [strategiesLoading, setStrategiesLoading] = useState(false);
    const [strategiesError, setStrategiesError] = useState<string | null>(null);
    const [generated, setGenerated] = useState<GeneratedAdversarialQuestion | null>(null);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const selectedSource = questions.find(q => q.question_bank_id === sourceQuestionId);

    useEffect(() => {
        let isMounted = true;
        const loadStrategies = async () => {
            setStrategiesLoading(true);
            setStrategiesError(null);
            try {
                const response = await apiGet<AdversarialStrategy[]>(
                    "/api/v1/adversarial-strategies/",
                    { headers: getAuthHeaders() }
                );
                if (isMounted) setStrategies(response);
            } catch (err) {
                if (isMounted) {
                    setStrategiesError(
                        err instanceof Error ? err.message : "Failed to load strategies."
                    );
                }
            } finally {
                if (isMounted) setStrategiesLoading(false);
            }
        };
        void loadStrategies();
        return () => { isMounted = false; };
    }, []);

    const handleGenerate = async () => {
        if(!sourceQuestionId || !strategyId) return;

        setIsGenerating(true);
        setGenerateError(null);
        try{
            const response = await apiPost<GeneratedAdversarialQuestion>(
                `/api/v1/questions/${sourceQuestionId}/generate-adversarial`,
                { strategy_id: strategyId },
                { headers: getAuthHeaders() }
            );
            setGenerated(response);
        } catch (err) {
            setGenerateError(
                err instanceof Error ? err.message : "Failed to generate adversarial question."
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = () => {
        if (!generated) return;
        const payload: QuestionPayload = {
            title: selectedSource?.title || "New Adversarial Question",
            category_id: selectedSource?.category_id || categories[0]?.category_id || 0,
            difficulty: selectedSource?.difficulty || "Medium",
            adv_question_id: generated.adv_question_id,
        };

        onSubmit(payload);
        onClose();
    };

    if(!isOpen) return null;
    
    return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-secondary-surface border border-tertiary-surface rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
      <div className="px-6 py-4 border-b border-tertiary-surface flex items-center justify-between bg-secondary-surface">
  <h2 className="text-xl font-staatliches tracking-wide">
    {mode === "edit" 
      ? `Edit Adversarial Question #${question_id}` 
      : "Create Adversarial Question"}
  </h2>
  <button onClick={onClose} className="text-white-smoke/40 hover:text-system-red">
    <X size={24} />
  </button>
</div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Source Question */}
          <div>
            <label className="block text-sm font-medium mb-2">Source Question</label>
            <select 
              value={sourceQuestionId || ""} 
              onChange={(e) => setSourceQuestionId(Number(e.target.value))}
              className="w-full p-3 border border-default-border rounded bg-secondary-surface text-white-smoke"
            >
              <option value="">Select a source question...</option>
              {questions.map(q => (
                <option key={q.question_bank_id} value={q.question_bank_id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>

          {/* Adversarial Technique */}
          <div>
            <label className="block text-sm font-medium mb-2">Adversarial Technique</label>
            <select
              value={strategyId ?? ""}
              onChange={(e) => setStrategyId(e.target.value ? Number(e.target.value) : null)}
              disabled={strategiesLoading}
              className="w-full p-3 border border-default-border rounded bg-secondary-surface text-white-smoke"
            >
              <option value="">
                {strategiesLoading ? "Loading strategies..." : "Select technique..."}
              </option>
              {strategies.map(s => (
                <option key={s.strategy_id} value={s.strategy_id}>
                  {s.strategy_name}
                </option>
              ))}
            </select>
            {strategiesError && (
              <p className="text-xs text-system-red mt-1">{strategiesError}</p>
            )}
          </div>

          {/* Generate Buttons */}
<div className="flex gap-3">
  <button
    onClick={handleGenerate}
    disabled={!sourceQuestionId || !strategyId || isGenerating}
    className="flex-1 py-3 bg-system-red text-white rounded flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50"
  >
    {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
    {isGenerating ? "GENERATING..." : "GENERATE ADVERSARIAL QUESTION"}
  </button>

  <button
    onClick={handleGenerate}
    disabled={!generated || isGenerating}
    className="flex-1 py-3 border border-default-border text-white-smoke rounded hover:bg-tertiary-surface disabled:opacity-50"
  >
    REGENERATE
  </button>
</div>

{generateError && (
  <p className="text-xs text-system-red">{generateError}</p>
)}

{/* Always Visible Preview Box */}
<div className="border border-tertiary-surface rounded p-5 bg-secondary-surface min-h-[200px]">
  <h3 className="font-staatliches text-lg mb-3 flex items-center gap-2">
    Generated Question Preview
    {generated && <span className="text-status-success text-sm">✓ Ready</span>}
  </h3>

  {generated ? (
    <div>
      <div className="font-medium text-white-smoke mb-3">
        {selectedSource?.title || "Generated Question"}
      </div>
      <div className="text-white-smoke/80 whitespace-pre-wrap leading-relaxed border-l-2 border-system-red pl-4">
        {generated.content}
      </div>
    </div>
  ) : (
    <div className="text-white-smoke/40 italic text-center py-12">
      AI generated question will appear here..
    </div>
  )}
</div>

{selectedSource && (
  <div className="text-xs text-white-smoke/60 mt-2">
    Source Category: {categories.find(c => c.category_id === selectedSource.category_id)?.category_name || "Unknown"}
  </div>
)}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-tertiary-surface flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border border-default-border rounded">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!generated || isSaving}
            className="px-6 py-2 bg-system-red text-white rounded disabled:opacity-50"
          >
            SAVE ADVERSARIAL QUESTION
          </button>
        </div>
      </div>
    </div>
  
    );
}