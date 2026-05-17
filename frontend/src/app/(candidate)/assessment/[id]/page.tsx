'use client';

import { useState, useEffect } from 'react';
import { Question } from "@/components/candidate/ui/cards/question.type";
import { TestDescriptionCard } from "@/components/candidate/ui/cards/test-description-card";
import { TestAnswerCard } from "@/components/candidate/ui/cards/test-answer-card";
import { TestNextButton } from "@/components/candidate/ui/buttons/test-next-button";
import { TestPreviousButton } from "@/components/candidate/ui/buttons/test-prev-button";

// Mock question data mapped to assessment IDs
const assessmentQuestions: { [key: string]: Question[] } = {
  '1': [
    {
      questionId: 1,
      questionTitle: "JavaScript Promise Resolution",
      questionText: "What is the output of this code?\n\nconst p = Promise.resolve(5);\np.then(x => x * 2).then(x => console.log(x));",
      type: 'multiple-choice',
      options: [
        "5",
        "10",
        "undefined",
        "Promise { 10 }"
      ],
      correctAnswer: "10",
      tags: ["javascript", "promises", "async"],
      attempted: true
    },
    {
      questionId: 2,
      questionTitle: "Reverse a String Function",
      questionText: "Write a function that reverses a string without using the built-in reverse() method.\n\nExample: reverseString('hello') should return 'olleh'",
      type: 'coding',
      options: [],
      correctAnswer: "function reverseString(str) { return str.split('').reduce((rev, char) => char + rev, ''); }",
      tags: ["javascript", "strings", "algorithms"],
      attempted: false
    },
    {
      questionId: 3,
      questionTitle: "Array Method Completion",
      questionText: "Complete the code:\n\nconst numbers = [1, 2, 3, 4];\nconst doubled = numbers._____(x => x * 2);\n// doubled = [2, 4, 6, 8]",
      type: 'fill-in-the-blank',
      options: ["map", "filter", "reduce", "forEach"],
      correctAnswer: "map",
      tags: ["javascript", "arrays", "functional-programming"],
      attempted: false
    }
  ]
};

export default function AssessmentCompletionPage({ params }: { params: Promise<{ id: string }> }) {
   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
   const [assessmentId, setAssessmentId] = useState<string | null>(null);

   useEffect(() => {
      params.then(p => setAssessmentId(p.id));
   }, [params]);

   const mockQuestions = assessmentId ? (assessmentQuestions[assessmentId] || []) : [];

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