"use client"
import QuestionListPage from "@/components/admin/shared/question-list-page";
import AdversarialQuestionModal from "./adversarial-question-modal";

export default function AdversarialQuestionsPage() {
  return (
    <QuestionListPage
      config={{
        newButtonLabel: "New Adverserial Question",
        deleteHeaderText: "Delete Adversarial Question",
        deleteTitle: "Are you sure?",
        deleteDescription:
          "This action cannot be undone. The question will be permanently removed from the adversarial question bank.",
        ModalComponent: AdversarialQuestionModal,
      }}
    />
  );
}