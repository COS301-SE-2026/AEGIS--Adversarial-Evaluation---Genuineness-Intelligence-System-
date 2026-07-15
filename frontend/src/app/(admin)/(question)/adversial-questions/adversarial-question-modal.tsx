"use client"

import { useState } from "react";
import { X, RefreshCw, Sparkles } from "lucide-react";
import { QuestionBank, QuestionCategory } from "../../types/questions";


interface AdversarialQuestionModalProps {
    isOpen: boolean;
    mode: "create" | "edit"
    question_id?: number | null;
    questions: QuestionBank[];
    categories: QuestionCategory[];
    onClose: () => void;
    onSubmit: (payload: any) => void;
}

export default function AdversarialQuestionModal({isOpen, onClose, questions, categories, onSubmit,}: AdversarialQuestionModalProps) {     
    const [sourceQuestionId, setSourceQuestionId] = useState<number | null>(null);
    const [technique, setTechnique] = useState("");
    const [generatedTitle, setGeneratedTitle] = useState("");
    const [generatedContent, setGeneratedContent] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);


   
    const selectedSource = questions.find(q => q.question_bank_id === sourceQuestionId);

    const handleGenerate = async () => {
        if(!sourceQuestionId || !technique) return;

        setIsGenerating(true);
        try{
            //mocking generation for now( replace with real API call)
            await new Promise(resolve => setTimeout(resolve, 1200));

            setGeneratedTitle(`Adversarial: ${selectedSource?.title || "Generated Question"}`);
            setGeneratedContent(`[Generated adversarial version using ${technique} technique]\n\nOriginal: ${selectedSource?.content || ""}\n\nModified content here...`);
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = () => {
        onSubmit({
            title: generatedTitle || "New Adversarial Question",
            content: generatedContent,
            source_question_id: sourceQuestionId,
            technique,
            category_id: selectedSource?.category_id,
            difficulty: "Medium",
        });
        onClose();
    };
    

    if(!isOpen) return null;

    

        
    
    return (
        
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-secondary-surface border border-tertiary-surface rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-tertiary-surface flex items-center justify-between bg-secondary-surface">
          <h2 className="text-xl font-staatliches tracking-wide">Create Adversarial Question</h2>
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
              value={technique} 
              onChange={(e) => setTechnique(e.target.value)}
              className="w-full p-3 border border-default-border rounded bg-secondary-surface text-white-smoke"
            >
              <option value="">Select technique...</option>
              <option value="paraphrase">Paraphrase Attack</option>
              <option value="semantic_shift">Semantic Shift</option>
              <option value="misleading_context">Misleading Context</option>
              <option value="adversarial_rewrite">Adversarial Rewrite</option>
              <option value="logic_trap">Logic Trap</option>
            </select>
          </div>

          {/* Generate Buttons */}
<div className="flex gap-3">
  <button
    onClick={handleGenerate}
    disabled={!sourceQuestionId || !technique || isGenerating}
    className="flex-1 py-3 bg-system-red text-white rounded flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50"
  >
    {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
    GENERATE ADVERSARIAL QUESTION
  </button>

  <button
    onClick={handleGenerate}
    disabled={!generatedContent || isGenerating}
    className="flex-1 py-3 border border-default-border text-white-smoke rounded hover:bg-tertiary-surface disabled:opacity-50"
  >
    REGENERATE
  </button>
</div>

{/* Always Visible Preview Box */}
<div className="border border-tertiary-surface rounded p-5 bg-secondary-surface min-h-[200px]">
  <h3 className="font-staatliches text-lg mb-3 flex items-center gap-2">
    Generated Question Preview
    {generatedContent && <span className="text-status-success text-sm">✓ Ready</span>}
  </h3>
  
  {generatedContent ? (
    <div>
      <div className="font-medium text-white-smoke mb-3">{generatedTitle}</div>
      <div className="text-white-smoke/80 whitespace-pre-wrap leading-relaxed border-l-2 border-system-red pl-4">
        {generatedContent}
      </div>
    </div>
  ) : (
    <div className="text-white-smoke/40 italic text-center py-12">
      AI generated question will appear here..
    </div>
  )}
</div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-tertiary-surface flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border border-default-border rounded">Cancel</button>
          <button 
            onClick={handleSubmit}
            disabled={!generatedContent}
            className="px-6 py-2 bg-system-red text-white rounded disabled:opacity-50"
          >
            SAVE ADVERSARIAL QUESTION
          </button>
        </div>
      </div>
    </div>
  
    );
}