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
  aiRate: number;
  created: string;
}