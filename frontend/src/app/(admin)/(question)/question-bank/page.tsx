"use client"
import QuestionListPage from "@/components/admin/shared/question-list-page";
import QuestionModal from "./question-modal";

export default function ViewQuestionsPage() {
  return (
    <QuestionListPage
      config={{
        newButtonLabel: "New Question",
        deleteHeaderText: "Delete Question",
        deleteTitle: "Are you sure you want to delete this question?",
        deleteDescription:
          "This action cannot be undone. The question will be permanently removed from the question bank.",
        ModalComponent: QuestionModal,
      }}
    />
  );
}