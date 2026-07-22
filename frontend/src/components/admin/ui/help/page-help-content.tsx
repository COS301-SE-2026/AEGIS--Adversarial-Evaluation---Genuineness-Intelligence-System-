import type { PageHelpConfig } from "./page-help-drawer";

export const PAGE_HELP_CONTENT: Record<string, PageHelpConfig> = {
    "/question-bank": {
    title: "Question Bank Guide",
    description:
      "This is your central repository for assessment materials. Create, organize, and manage questions before deploying them into live assessments.",
    steps: [
      {
        title: "Search & Filter",
        body: "Use the top filter bar to find questions by title, content, tags, category, or difficulty.",
      },
      {
        title: "Create Questions",
        body: "Use the New Question action to author coding, MCQ, text, or comprehension items.",
      },
      {
        title: "Manage Questions",
        body: "Use the action icons to edit a row or permanently delete outdated questions.",
      },
    ],
    faq: [
      {
        question: "Can I recover deleted questions?",
        answer:
          "No. Deleted questions are permanently removed once the confirmation step is completed.",
      },
      {
        question: "How do I add a new category?",
        answer:
          "New categories should be added from the main settings or configuration area, not from the question table itself.",
      },
    ],
    footerLabel: "Go to Full Help Center",
    footerHref: "/help-center",
  },

  "/assessments": {
    title: "Assessments Guide",
    description: "Create, schedule, and manage live assessments from this page.",
    steps: [
      { title: "Open a draft", body: "Review the assessment overview cards and pick the one you want to edit." },
      { title: "Configure details", body: "Set the role, time limit, question mix, and candidate targeting." },
      { title: "Deploy", body: "Publish the assessment when the review has been completed." },
    ],
  },
}