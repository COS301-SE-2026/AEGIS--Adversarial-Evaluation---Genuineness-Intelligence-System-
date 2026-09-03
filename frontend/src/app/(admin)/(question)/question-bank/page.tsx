"use client";

import QuestionListPage from "@/components/admin/shared/question-list-page";
import QuestionModalRouter from "./question-modal-router";
import { PAGE_HELP_CONTENT } from "@/components/admin/ui/help/page-help-content";

export default function ViewQuestionsPage() {
  return (
    <QuestionListPage
      config={{
        newButtonLabel: "New Question",
        newButtonLabelShort: "New",
        deleteHeaderText: "Delete Question",
        deleteTitle: "Are you sure you want to delete this question?",
        deleteDescription:
          "This action cannot be undone. The question will be permanently removed from the question bank.",
        ModalComponent: QuestionModalRouter,
        helpConfig: PAGE_HELP_CONTENT["/question-bank"],
        mode: "source",
      }}
    />
  );
}