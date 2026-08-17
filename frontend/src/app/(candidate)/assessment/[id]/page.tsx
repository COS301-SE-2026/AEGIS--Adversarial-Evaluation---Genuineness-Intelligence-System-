'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from "next/navigation"
import { TestDescriptionCard } from "@/components/candidate/ui/cards/test-description-card";
import { TestAnswerCard } from "@/components/candidate/ui/cards/test-answer-card";
import { TestNextButton } from "@/components/candidate/ui/buttons/test-next-button";
import { TestPreviousButton } from "@/components/candidate/ui/buttons/test-prev-button";
import { TestSubmitButton } from "@/components/candidate/ui/buttons/test-submit-button";
import type { Question } from "@/components/candidate/ui/cards/question.type";
import { useAssessmentTimer } from '@/components/candidate/context/assessment-timer';
import { useAssessmentTelemetry } from "@/components/candidate/hooks/use-assessment-telemetry";
import { apiGet, apiPost } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";

type CandidateAssessmentQuestionApi = {
   assessment_q_id: number;
   display_order?: number | null;
   marks?: number | null;
   question: {
      question_bank_id: number;
      title: string;
      content: string;
      type: string;
      maximum_score?: number | null;
      tags?: string[] | null;
      question_metadata?: Record<string, unknown> | null;
   } | null;
};

type CandidateResponseApi = {
   response_id: number;
   candidate_assessment_id: number;
   assessment_question_id: number;
   candidate_answer?: string | null;
   score?: number | null;
   is_correct?: string | null;
};

type CandidateAssessmentSessionApi = {
   candidate_assess_id: number;
   status: string;
   access_token?: string | null;
   total_score?: number | null;
   start_time?: string | null;
   end_time?: string | null;
}

function extractFillBlankLabels(content: string | undefined | null): string[] {
   if (typeof content !== "string" || !content.trim()) {
      return [];
   }

   const matches = content.match(/\[([A-Z])\]/g) ?? [];
   const labels = matches
      .map((match) => match.slice(1, -1))
      .filter((label, index, array) => array.indexOf(label) === index);

   return labels;
}

function mapQuestionType(value: string): Question["type"] {
   const type = value.trim().toUpperCase();

   switch (type) {
      case "MULTIPLE_CHOICE":
         return "multiple-choice";

      case "CODING":
         return "coding";

      case "FILL_IN_BLANK":
      case "FILL_IN_THE_BLANK":
         return "fill-in-the-blank"

      default:
         console.warn(`Unknown question type: ${value}`);
         return "fill-in-the-blank"
   }
}

function mapQuestionOptions(
   metadata: Record<string, unknown> | null | undefined,
   questionType: Question["type"],
   questionContent?: string | null,
): string[] {
   if (questionType === "multiple-choice") {
      const rawOptions = metadata?.options ?? metadata?.choices ?? metadata?.answers;

      if (Array.isArray(rawOptions)) {
         return rawOptions
            .map((option) => {
               if (typeof option === "string") {
                  return option;
               }

               if (option && typeof option === "object") {
                  const record = option as Record<string, unknown>;
                  const label = record.label ?? record.value ?? record.text;
                  return label ? String(label) : null;
               }

               return null;
            })
            .filter((option): option is string => Boolean(option));
      }

      if (rawOptions && typeof rawOptions === "object") {
         const record = rawOptions as Record<string, unknown>;
         return ["A", "B", "C", "D"]
            .map((label) => record[label])
            .filter((option): option is unknown => option !== undefined && option !== null)
            .map(String);
      }

      return [];
   }

   if (questionType === "fill-in-the-blank") {
      const rawBlanks = metadata?.blanks;
      if (Array.isArray(rawBlanks)) {
         return rawBlanks
            .filter((blank): blank is string => typeof blank === "string" && Boolean(blank.trim()))
            .map((blank) => blank.trim());
      }

      return extractFillBlankLabels(questionContent);
   }

   return [];
}

function mapFunctionSignature(
   metadata: Record<string, unknown> | null | undefined,
): string {
   const rawSignature = metadata?.function_signature ?? metadata?.functionSignature;
   if (typeof rawSignature === "string" && rawSignature.trim()) {
      return rawSignature.trim();
   }

   return "";
}

export default function AssessmentCompletionPage({ params }: { params: Promise<{ id: string }> }) {
   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
   const [candidateAssessId, setCandidateAssessId] = useState<string | null>(null);
   const [questions, setQuestions] = useState<Question[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isSubmitted, setIsSubmitted] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);
   const [error, setError] = useState<string | null>(null);
   const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<number, string>>({});
   const {endTime, setEndTime} = useAssessmentTimer();

   const { flushTelemetry } = useAssessmentTelemetry(candidateAssessId);

   useEffect(() => {
      params.then(p => setCandidateAssessId(p.id));
   }, [params]);

   useEffect(() => {
      if (!candidateAssessId) {
         return;
      }

      let isMounted = true;

      const loadQuestions = async () => {
         try {
            setIsLoading(true);
            setError(null);
            const authToken = getToken() ?? undefined;
            const [sessionData, questionData, responseData] = await Promise.all([
               apiGet<CandidateAssessmentSessionApi>(
                  `/api/v1/candidate/assessments/${candidateAssessId}`,
                  authToken ? { authToken } : {}                  
               ),
               apiGet<CandidateAssessmentQuestionApi[]>(
                  `/api/v1/assessments/candidate/${candidateAssessId}/questions`,
                  authToken ? { authToken } : {}
               ),
               apiGet<CandidateResponseApi[]>(
                  `/api/v1/candidate-assessments/${candidateAssessId}/responses`,
                  authToken ? { authToken } : {}
               )
            ]);

            const mapped = questionData
               .filter((item) => item.question)
               .map((item) => {
                  const question = item.question as NonNullable<
                     CandidateAssessmentQuestionApi["question"]
                  >;
                  console.log(question.type);
                  const mappedType = mapQuestionType(question.type);

                  return {
                     questionId: item.assessment_q_id,
                     questionTitle: question.title,
                     questionContent: question.content,
                     type: mappedType,
                     functionSignature: mapFunctionSignature(question.question_metadata),
                     options: mapQuestionOptions(question.question_metadata, mappedType, question.content),
                     correctAnswer: "" as Question["correctAnswer"],
                     tags: question.tags ?? [],
                     attempted: false,
                  } satisfies Question;
               });

            const existingAnswers = responseData.reduce<Record<number, string>>(
               (acc, response) => {
                  if (response.candidate_answer) {
                     acc[response.assessment_question_id] = response.candidate_answer;
                  }
                  return acc;
               },
               {}
            );

            if (isMounted) {
               setQuestions(mapped);
               setCurrentQuestionIndex(0);
               setAnswersByQuestionId(existingAnswers);
               
               if (sessionData.end_time) {
                  setEndTime(sessionData.end_time);
               }
            }
         } catch (err) {
            const message = err instanceof Error
               ? err.message
               : "Unable to load assessment questions.";
            if (isMounted) {
               setError(message);
            }
         } finally {
            if (isMounted) {
               setIsLoading(false);
            }
         }
      };

      loadQuestions();

      return () => {
         isMounted = false;
      };
   }, [candidateAssessId, setEndTime]);

   const currentQuestion = questions[currentQuestionIndex];
   const totalQuestions = questions.length;
   const isLastQuestion = totalQuestions > 0 && currentQuestionIndex === totalQuestions - 1;
   const router = useRouter();

   const saveCurrentAnswer = useCallback(async () => {
      if (!candidateAssessId || !currentQuestion) {
         return;
      }

      const answer = answersByQuestionId[currentQuestion.questionId];
      if (!answer) {
         return;
      }

      const authToken = getToken() ?? undefined;
      await apiPost<CandidateResponseApi, { assessment_question_id: number; candidate_answer: string }>(
         `/api/v1/candidate-assessments/${candidateAssessId}/responses`,
         {
            assessment_question_id: currentQuestion.questionId,
            candidate_answer: answer,
         },
         authToken ? { authToken } : {}
      );
   }, [answersByQuestionId, candidateAssessId, currentQuestion]);

   const handleNext = async () => {
      if (isSaving || currentQuestionIndex >= totalQuestions - 1) {
         return;
      }

      try {
         setIsSaving(true);
         await saveCurrentAnswer();
         flushTelemetry();
         setCurrentQuestionIndex(currentQuestionIndex + 1);
      } finally {
         setIsSaving(false);
      }
   };

   const handlePrevious = () => {
      if (currentQuestionIndex > 0) {
         setCurrentQuestionIndex(currentQuestionIndex - 1);
      }
   };

   const handleSubmit = useCallback(async () => {
      if (isSubmitting || !candidateAssessId) return;

      try {
         setSubmitError(null);
         setIsSubmitting(true);
         // ensure last answer is saved
         await saveCurrentAnswer();

         const authToken = getToken() ?? undefined;
         await apiPost(`/api/v1/candidate-assessments/${candidateAssessId}/submit`, undefined, authToken ? { authToken } : {});
         router.replace("/assessment");

         setIsSubmitted(true);
      } catch (err) {
         const message = err instanceof Error ? err.message : "Unable to submit assessment.";
         setSubmitError(message);
      } finally {
         setIsSubmitting(false);
      }
   }, [candidateAssessId, isSubmitting, router, saveCurrentAnswer]);

   useEffect(()=>{
      if (!endTime || isSubmitted || isSubmitting) return;

      const timeRemaining = new Date(endTime).getTime() - Date.now();

      const timeout = setTimeout(()=>{
         handleSubmit()
      }, Math.max(timeRemaining, 0));

      return () => clearTimeout(timeout);
   }, [endTime, handleSubmit, isSubmitted, isSubmitting]);

   if (!candidateAssessId || isLoading) {
      return (
         <main className="flex items-center justify-center min-h-screen">
            <p className="text-default-text">Loading assessment...</p>
         </main>
      );
   }

   if (error) {
      return (
         <main className="flex items-center justify-center min-h-screen">
            <p className="text-system-red">{error}</p>
         </main>
      );
   }

   if (!currentQuestion) {
      return (
         <main className="flex items-center justify-center min-h-screen">
            <p className="text-default-text">No questions available.</p>
         </main>
      );
   }

     if (isSubmitted) {
        return (
           <main className="flex flex-col items-center justify-center min-h-screen">
              <h2 className="text-2xl">Assessment submitted</h2>
              <p className="mt-4 text-default-text">Thank you — your assessment has been submitted.</p>
              {submitError && <p className="mt-2 text-system-red">{submitError}</p>}
           </main>
        );
     }

    return (
        <main className="min-h-screen py-8 px-8">
            <div className="mx-auto max-w-screen-2xl">
               
               <section className="flex flex-col lg:flex-row gap-6">
               
                  <TestDescriptionCard question={currentQuestion} />
                  
                  <section className='flex-1'>
                     <TestAnswerCard
                        question={currentQuestion}
                        value={answersByQuestionId[currentQuestion.questionId] ?? ""}
                        candidateAssessId={candidateAssessId}
                        onChange={(value) => {
                           setAnswersByQuestionId((prev) => ({
                              ...prev,
                              [currentQuestion.questionId]: value,
                           }));
                        }}
                     />
                  </section>
               </section>

            </div>

            <footer className="flex justify-between items-center mt-8">
               <div className="mx-auto flex flex-row items-center gap-4">
                  <TestPreviousButton handlePrevious={handlePrevious} />
                  <p>{currentQuestionIndex + 1} / {totalQuestions}</p>
                  <TestNextButton handleNext={handleNext} />
                  {isSaving && (
                     <span className="text-xs text-default-text/70">Saving...</span>
                  )}
               </div>
               <div className="absolute right-18">
                  {isLastQuestion && (
                     <TestSubmitButton onClick={handleSubmit} disabled={isSaving || isSubmitting} isSubmitting={isSubmitting} />
                  )}
               </div>
            </footer>
            
        </main>
    );
}