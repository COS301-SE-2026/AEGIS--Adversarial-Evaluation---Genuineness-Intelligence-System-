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
  readonly onClose: () => void;
}
//mock questions
const QUICK_QUESTIONS= [
  {id: 1, title:"Two Sum", content: "Find two numbers that add up to a target in an array", category: "Algorithms", difficulty: "Easy" as const}, 
  {id: 2, title:"Add Two Numbers", content: "Add two numbers represented as linked lists in reverse order", category: "Data Structures", difficulty: "Medium" as const},
  {id: 3, title: "Find Longest Substring", content: "Find the length of the longest substring without repeating characters", category: "Algorithms", difficulty: "Hard" as const },
  {id: 4, title: "Valid Parentheses", content: "Determine if the input string continas valid parentheses", category: "Data Structures", difficulty: "Easy" as const},
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

  const createIt = () => {
    console.log("creating assessment with:", {formData, selectedIds});
    //to do: real API call will prolly go here
    onClose();
  }

  //will add the other sections later
  return(
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={(e) => e.target === e.currentTarget && onClose()} onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      
    }
  }}>
    <div className="w-[720px] max-w-[95vw] bg-secondary-surface border-l border-tertiary-surface flex flex-col h-full overflow-hidden">
      {/* Header */}
    <div className="px-7 py-5 border-b border-tertiary-surface flex items-center justify-between">
      <div>
        <div className="font-staatliches text-[22px] tracking-[0.07em] text-white-smoke">CREATE ASSESSMENT</div>
          <div className="font-ibm-plex text-[10px] text-white-smoke/40 mt-0.5"> starting with the basics</div>
      </div>
      <button onClick={onClose} className="text-white-smoke/40 hover:text-system-red">✕</button>
      </div>

      {/* Stepper for the wizard */}
      <div className="flex px-7 py-4 border-b border-tertiary-surface gap-1">
        {[
          {id: 0, label: "Basic", sub: "details"},
          {id: 1, label: "Questions", sub: "select"},
          {id: 2, label: "Confirm", sub: "final"}
          ].map((s) => (
          <button
          key = {s.id}
          onClick ={() => s.id <= step && setStep(s.id)}
          className={`flex-1 flex items-center gap-3 ${s.id > step ? "opacity-40" : ""}`}>
            <div className = {`w-7 h-7 rounded flex items-center justify-center border ${s.id < step ? "bg-status-success-dim text-status-success" : s.id === step ? "bg-white text-black" : "border-default-border text-white-smoke/50"}`}>
              {s.id < step ? "✓" : s.id+1}
            </div>
            <div>
              <div className = {`font-staatliches text-sm ${s.id === step ? "" : "text-white-smoke/60"}`}>{s.label}</div>
              <div className="text-[9px] text-white-smoke/30">{s.sub}</div>
            </div>            
          </button>
        ))}
      </div>


      <div className="flex-1 overflow-y-auto px-7 py-6"> 
        {/*Section 1*/}
        {step === 0 && (
        <div className="mb-6">
          <div className={sectionTitleCls}>Assessment Identity</div>

          <div className="mb-3.5">
            <label htmlFor="title" className={`${labelCls} block mb-1.5`}>Title *</label>
            <input
              id = "title"
              className={inputCls}
              placeholder="Senior Backend Algorithm Sprint"
              value={formData.name}
              onChange={(e) => updateForm("name", e.target.value)}
              />
          </div>

          <div className="mb-3.5">
            <label htmlFor="description" className={`${labelCls} block mb-1.5`}>Description</label>
            <textarea
            id="description"
            className= {`${inputCls} resize-y min-h-[80px] leading-relaxed`}
            placeholder="Briefly describe the purpose..."
            value={formData.description}
            onChange={(e) => updateForm("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div> 
              <label htmlFor="role" className={`${labelCls} block mb-1.5`}>Target Role</label>
              <select
                id="role"
                className={`${inputCls} cursor-pointer appearance-none`}
                value={formData.role}
                onChange={(e) => updateForm("role", e.target.value)}>
                  {TARGET_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="timeLimit"className={`${labelCls} block mb-1.5`}>Time Limit (min)</label>
              <input
              id="timeLimit"
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
                  {/* Section 2 */}
            {step === 1 && (
              <div className="mb-6">
                <div className={sectionTitleCls}>Pick Questions</div>

                <div className="mb-4">
                  <label htmlFor="questionCount" className={`${labelCls} block mb-1.5`}>Target count</label>
                  <input id="questionCount" type="range" min="3" max="15" value={formData.questionCount} onChange={(e) => updateForm("questionCount", Number(e.target.value))} className="w-full accent-system-red"/>
                  <div className="text-right font-staatliches text-system-red text-sm mt-1">{formData.questionCount} target</div>
                  </div>

                <div className="max-h-[340px] overflow-y-auto pr-2 space-y-2">
                  {QUICK_QUESTIONS.map(q => {
                    const selected = selectedIds.includes(q.id);
                    const cardClassName = selected
                     ? "border-system-red bg-system-red/5"
                     : "border-default-border hover:border-white-smoke/30";

                    return(

                    <button
                    type="button"
                    key={q.id}
                    onClick = {() => toggleQuestion(q.id)}
                    onKeyDown = {(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleQuestion(q.id);
                      }
                    }}
                className={`w-full text-left p-3.5 rounded-[5px] border cursor-pointer transition-all ${cardClassName}`}>

                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{q.title}</div>
                        <div className="text-xs text-white-smoke/60 line-clamp-2">{q.content}</div>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] px-2 py-0.5 bg-tertiary-surface rounded">{q.category}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-tertiary-surface rounded">{q.difficulty}</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border mt-1 ${selected ? "bg-system-red text-white" : "border-default-border"}`}>
                        {selected && "✓"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
                  </div>
            )}

            {/* Section 3 */}
            {step === 2 &&(
              <div>
                <div className="font-staatliches text-base tracking-[0.07em] mb-4 flex items-center gap-2">
                  READY TO GO
                  <div className="flex-1 h-px bg-default-border" />
                  </div>
                <div className="bg-secondary-surface border border-default-border rounded-[5px] p-4 space-y-2 text-sm">
                  <div><span className="text-white-smoke/60">Title:</span> {formData.name || "Unititled"}</div>
                  <div><span className="text-white-smoke/60">Role:</span> {formData.role}</div>
                  <div><span className="text-white-smoke/60">Time:</span> {formData.timeLimit} min</div>
                  <div><span className="text-white-smoke/60">Questions:</span> {selectedIds.length} (target {formData.questionCount})</div>
                  </div>
                  </div>

            )}
            </div>

            {/* Basic Footer in the meantime*/}
            <div className="px-7 py-4 border-t border-tertiary-surface flex justify-end bg-secondary-surface">
              <div className="font-ibm-plex text-[12px] text-white-smoke/40 mr-auto"> Step {step+1}/3</div>
              <div className="flex gap-3">
                {step > 0 && <button onClick={() => setStep(s => s - 1)} className="px-5 py-2 border border-default-border hover:text-white-smoke rounded-[5px] font-staatliches text-sm">BACK</button>}
                {step < 2 ? (
                  <button onClick={() => setStep(s => s + 1)} className="px-8 py-2 bg-default-text text-background font-staatliches rounded-[5px] hover:bg-white">CONTINUE</button>
                ) : (
                  <button onClick={createIt} className="px-8 py-2 bg-default-text text-background font-staatliches rounded-[5px] hover:bg-white">CREATE ASSESSMENT</button>
                )}
              </div>
              
              
              </div>
              </div>
              </div>
        
  );
}
