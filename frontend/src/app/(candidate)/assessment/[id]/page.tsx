'use client';

import { useState, useEffect } from 'react';
import { TestDescriptionCard } from "@/components/candidate/ui/cards/test-description-card";
import { TestAnswerCard } from "@/components/candidate/ui/cards/test-answer-card";
import { TestNextButton } from "@/components/candidate/ui/buttons/test-next-button";
import { TestPreviousButton } from "@/components/candidate/ui/buttons/test-prev-button";
import { TestSubmitButton } from "@/components/candidate/ui/buttons/test-submit-button";
import type { Question } from "@/components/candidate/ui/cards/question.type";
import { apiGet } from "@/lib/apiClient";
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

function mapQuestionType(value: string): Question["type"] {
   if (value === "MULTIPLE_CHOICE") {
      return "multiple-choice";
   }
   if (value === "TEXT") {
      return "fill-in-the-blank";
   }
   return "fill-in-the-blank";
}

function mapQuestionOptions(
   metadata: Record<string, unknown> | null | undefined,
   questionType: Question["type"]
): string[] {
   if (questionType !== "multiple-choice") {
      return [];
   }

   const rawOptions = metadata?.options ?? metadata?.choices ?? metadata?.answers;
   if (!Array.isArray(rawOptions)) {
      return [];
   }

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

export default function AssessmentCompletionPage({ params }: { params: Promise<{ id: string }> }) {
   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
   const [candidateAssessId, setCandidateAssessId] = useState<string | null>(null);
   const [questions, setQuestions] = useState<Question[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

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
            const data = await apiGet<CandidateAssessmentQuestionApi[]>(
               `/api/v1/assessments/candidate/${candidateAssessId}/questions`,
               authToken ? { authToken } : {}
            );

            const mapped = data
               .filter((item) => item.question)
               .map((item) => {
                  const question = item.question as NonNullable<
                     CandidateAssessmentQuestionApi["question"]
                  >;

                  const mappedType = mapQuestionType(question.type);

                  return {
                     questionId: item.assessment_q_id,
                     questionTitle: question.title,
                     questionContent: question.content,
                     type: mappedType,
                     options: mapQuestionOptions(question.question_metadata, mappedType),
                     correctAnswer: "" as Question["correctAnswer"],
                     tags: question.tags ?? [],
                     attempted: false,
                  } satisfies Question;
               });

            if (isMounted) {
               setQuestions(mapped);
               setCurrentQuestionIndex(0);
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
   }, [candidateAssessId]);

   const currentQuestion = questions[currentQuestionIndex];
   const totalQuestions = questions.length;
   const isLastQuestion = totalQuestions > 0 && currentQuestionIndex === totalQuestions - 1;

   const handleNext = () => {
      if (currentQuestionIndex < totalQuestions - 1) {
         setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
   };

   const handlePrevious = () => {
      if (currentQuestionIndex > 0) {
         setCurrentQuestionIndex(currentQuestionIndex - 1);
      }
   };

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

    return (
        <main className="flex flex-col items-center justify-start min-h-screen 2xl:gap-8">
            <div className="flex flex-row items-center 2xl:gap-4">
               <TestDescriptionCard question={currentQuestion} />
               <TestAnswerCard question={currentQuestion} />

            </div>

            <div className="relative flex w-full items-center">
               <div className="mx-auto flex flex-row items-center gap-4">
                  <TestPreviousButton handlePrevious={handlePrevious} />
                  <p>{currentQuestionIndex + 1} / {totalQuestions}</p>
                  <TestNextButton handleNext={handleNext} />
               </div>
               <div className="absolute right-18">
                  {isLastQuestion && <TestSubmitButton />}
               </div>
            </div>
            
        </main>
    );
}