'use client';

import { useState, useEffect } from 'react';
import { TestDescriptionCard } from "@/components/candidate/ui/cards/test-description-card";
import { TestAnswerCard } from "@/components/candidate/ui/cards/test-answer-card";
import { TestNextButton } from "@/components/candidate/ui/buttons/test-next-button";
import { TestPreviousButton } from "@/components/candidate/ui/buttons/test-prev-button";
import { mockAssessmentQuestions } from "@/lib/mockData";

export default function AssessmentCompletionPage({ params }: { params: Promise<{ id: string }> }) {
   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
   const [assessmentId, setAssessmentId] = useState<string | null>(null);

   useEffect(() => {
      params.then(p => setAssessmentId(p.id));
   }, [params]);

   const mockQuestions = assessmentId ? (mockAssessmentQuestions[assessmentId] || []) : [];

   const currentQuestion = mockQuestions[currentQuestionIndex];
   const totalQuestions = mockQuestions.length;

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

   if (!assessmentId || !currentQuestion) {
      return (
         <main className="flex items-center justify-center min-h-screen">
            <p className="text-default-text">Loading assessment...</p>
         </main>
      );
   }

    return (
        <main className="flex flex-col items-center justify-start min-h-screen gap-8">
            <div className="flex flex-row items-center gap-4">
               <TestDescriptionCard question={currentQuestion} />
               <TestAnswerCard question={currentQuestion} />

            </div>

            <div className=" flex flex-row items-center gap-4">
               <TestPreviousButton handlePrevious={handlePrevious} />
               <p>{currentQuestionIndex + 1} / {totalQuestions}</p>
               <TestNextButton handleNext={handleNext} />
            </div>
        </main>
    );
}