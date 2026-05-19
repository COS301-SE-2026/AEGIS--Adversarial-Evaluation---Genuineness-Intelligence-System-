// ─── Core domain types ─────────────────────────────────────────────────────

export type AssessmentStatus = "active" | "closed" | "pending" | "draft";

export type Difficulty = "Junior" | "Mid" | "Senior" | "Lead" | "Architect";

export interface Assessment {
  id: number;
  title: string;
  role: string;
  difficulty: Difficulty;
  status: AssessmentStatus;
  types: string[];
  langs: string[];
  questions: number;
  candidates: number;
  completed: number;
  /** AI-detection rate as an integer 0–100 */
  aiRate: number;
  created: string; // YYYY-MM-DD
}

// ─── Question / technique meta (used in mock-data and wizard) ─────────────

export type QuestionTypeKey =
  | "code"
  | "debug"
  | "algo"
  | "sysdes"
  | "sql"
  | "api"
  | "logic"
  | "review";

export interface QuestionTypeMeta {
  key: QuestionTypeKey;
  icon: string;
  label: string;
  sub: string;
}

export interface AdversarialTechnique {
  id: string;
  label: string;
  sub: string;
  eff: "HIGH" | "MED" | "LOW";
}

// ─── Create-assessment wizard form ────────────────────────────────────────

export interface CreateAssessmentForm {
  // Step 0 — Basic Info
  name: string;
  role: string;
  description: string;
  difficulty: Difficulty;
  // Step 1 — Targeting
  assignedCandidates: string[];
  scoringMethod: "auto" | "manual" | "hybrid";
  resultVisibility: "immediate" | "after-review" | "hidden";
  notifyOnComplete: boolean;
  // Step 2 — Settings (kept for full wizard; unused fields are just ignored)
  questionTypes: string[];
  languages: string[];
  questionCount: number;
  timeLimit: number;
  randomise: boolean;
  autosave: boolean;
  proctoring: boolean;
  shuffleOptions: boolean;
  adversarialDensity: number;
  techniques: string[];
}

// ─── Navigation ───────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}