"use client";

import { ComponentType } from "react";
import { QuestionBank, QuestionCategory, QuestionPayload } from "@/app/(admin)/types/questions";
import { QuestionListModalProps } from "@/components/admin/shared/question-list-page";
import CreateQuestionContainer from "@/components/admin/ui/question-builder/create-question-container";
import LegacyQuestionModal from "./legacy-question-modal";


export default function QuestionModalRouter({
  isOpen,
  mode,
  question_id,
  questions,
  categories,
  onClose,
  onSubmit,
  isSaving,
}: QuestionListModalProps) {
  if (mode === "create") {
   
    return (
      <CreateQuestionContainer
        open={isOpen}
        categories={categories}
        isSaving={isSaving ?? false}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <LegacyQuestionModal
      key={question_id ?? "closed"}  
      isOpen={isOpen && question_id !== null}
      mode="edit"
      isSaving={isSaving ?? false}
      question_id={question_id}
      questions={questions}
      categories={categories}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}