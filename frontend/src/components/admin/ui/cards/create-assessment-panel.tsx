"use client";

import { useState, useCallback } from "react";
import type {CreateAssessmentForm, Difficulty} from "../../../../app/(admin)/types/assessment";
import { 
  TARGET_ROLES,
} from "../../../../app/(admin)/types/mock-data";

const labelCls = "font-ibm-plex text-[10px] tracking-[0.1em] text-white-smoke/40 uppercase font-medium";
const inputCls = "w-full bg-secondary-surface border border-default-border text-white-smoke px-3.5 py-2.5 font-ibm text-[13px] rounded-[5px] outline-none transition-colors duration-150 placeholder:text-white-smoke/40 focus:border-system-red";
const sectionTitleCls = "font-staatliches text-base tracking-[0.07em] text-white-smoke mb-3.5 flex items-center gap-2 after:flex-1 after:h-px after:bg-default-border after:content-['']";

interface Props { 
  onClose: () => void;
}
//mock questions
const QUICK_QUESTIONS= [
  {id: 1, title:"Two Sum", content: "Find two numbers that add up to a target in an array", category: "Algorithms", difficulty: "Easy" as const}, 
  {id: 2, title:"Add Two Numbers", content: "Add two numbers represented as linked lists in reverse order", category: "Data Structures", difficulty: "Medium" as const},
  {id: 3, title: "Find Longest Substring", content: "Find the length of the longest substring without repeating characters", category: "Algorithms", difficulty: "Hard" as const },
];

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

export default function CreateAssessmentPanel({ onClose }: Props) {
  const [step, setStep] = useState(0); //more steps coming later, only 1 for now
  const[formData, setFormData] = useState<CreateAssessmentForm>(DEFAULT_FORM);
  const [selectedIds, setSelectedIds] = useState<number[]>([]); //this tracks the selected question

  const updateForm = useCallback(<K extends keyof CreateAssessmentForm>(key: K, value: CreateAssessmentForm[K]) => {
    setFormData(prev => ({...prev, [key]: value}));
  }, []);

  const toggleQuestion = (id: number) => {
    setSelectedIds (prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  //will add the other sections later
  return(
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="w-[720px] max-w-[95vw] bg-secondary-surface border-l border-tertiary-surface flex flex-col h-full overflow-hidden">
      {/* Header */}
    <div className="px-7 py-5 border-b border-tertiary-surface flex items-center justify-between">
      <div>
        <div className="font-staatliches text-[22px] tracking-[0.07em] text-white-smoke">CREATE ASSESSMENT</div>
          <div className="font-ibm-plex text-[10px] text-white-smoke/40 mt-0.5">// starting with basics</div>
      </div>
      <button onClick={onClose} className="text-white-smoke/40 hover:text-system-red">✕</button>
      </div>

      {/* Stepper for the wizard */}
      <div className="flex px-7 py-4 border-b border-tertiary-surface gap-1">
        {[0, 1].map((i) => (
          <button
          key = {i}
          onClick ={() => setStep(i)}
          className={`flex-1 py-2 text-center rounded border ${step === i ? "border-system-red bg-system-red/10" : "border-default-border"}`}>
            Step {i+1}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-6"> 
        {/*Section 1*/}
        {step === 0 && (
        <div className="mb-6">
          <div className={sectionTitleCls}>Assessment Identity</div>

          <div className="mb-3.5">
            <label className={`${labelCls} block mb-1.5`}>Title *</label>
            <input
              className={inputCls}
              placeholder="Senior Backend Algorithm Sprint"
              value={formData.name}
              onChange={(e) => updateForm("name", e.target.value)}
              />
          </div>

          <div className="mb-3.5">
            <label className={`${labelCls} block mb-1.5`}>Description</label>
            <textarea
            className= {`${inputCls} resize-y min-h-[80px] leading-relaxed`}
            placeholder="Briefly describe the purpose..."
            value={formData.description}
            onChange={(e) => updateForm("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div> 
              <label className={`${labelCls} block mb-1.5`}>Target Role</label>
              <select
                className={`${inputCls} cursor-pointer appearance-none`}
                value={formData.role}
                onChange={(e) => updateForm("role", e.target.value)}>
                  {TARGET_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className={`${labelCls} block mb-1.5`}>Time Limit (min)</label>
              <input
              type="number"
              min="15"
              max="180"
              className={inputCls}
              value={formData.timeLimit}
              onChange={(e) => updateForm("timeLimit", Number(e.target.value))}
              />
            </div>
            </div>
            </div> )}

            {step === 1 && (
              <div className="mb-6">
                <div className={sectionTitleCls}>Pick Questions</div>

                <div className="mb-4">
                  <label className={`${labelCls} block mb-1.5`}>Target count</label>
                  <input type="range" min="3" max="15" value={formData.questionCount} onChange={(e) => updateForm("questionCount", Number(e.target.value))} className="w-full accent-system-red"/>
                  <div className="text-right font-staatliches text-system-red text-sm mt-1">{formData.questionCount} target</div>
                  </div>

                <div className="max-h-[340px] overflow-y-auto pr-2 space-y-2">
                  {QUICK_QUESTIONS.map(q => {
                    const selected = selectedIds.includes(q.id);
                    return(
                      <div key={q.id} onClick={() => toggleQuestion(q.id)} className={`p-3.5 rounded-[5px] border cursor-pointer transition-all ${selected ? "border-system-red bg-system-red/5" : "border-default-border hover:border-white-smoke/30"}`}>
                        <div className="font-medium">{q.title}</div>
                        <div className="text-xs text-white-smoke/60 line-clamp-2">{q.content}</div>
                        </div>
                    );
                  })}
                  </div>
                  </div>
            )}
            </div>

            {/* Basic Footer in the meantime*/}
            <div className="px-7 py-4 border-t border-tertiary-surface flex justify-end bg-secondary-surface">
              {step > 0 && <button onClick={() => setStep(s => s - 1)} className="px-5 py-2 border border-default-border hover:text-white-smoke rounded-[5px] font-staatliches text-sm">BACK</button>}
              <button onClick={onClose} className="px-5 py-2 border border-default-border text-white-smoke/70 hover:text-white-smoke rounded-[5px] font-staatliches text-sm">CLOSE</button>
              </div>
              </div>
              </div>
        
  );
}
