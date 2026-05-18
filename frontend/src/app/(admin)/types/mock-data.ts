import type {
  Assessment,
  QuestionTypeMeta,
  AdversarialTechnique,
  NavItem,
} from "./assessment";

export const MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: 1,
    title: "JS Algorithm Sprint",
    role: "Backend",
    difficulty: "Mid",
    status: "active",
    types: ["Algorithm", "Debugging", "Code"],
    langs: ["JavaScript", "TypeScript"],
    questions: 16,
    candidates: 34,
    completed: 28,
    aiRate: 72,
    created: "2026-05-08",
  },
  {
    id: 2,
    title: "Backend Debug Challenge",
    role: "Backend",
    difficulty: "Senior",
    status: "closed",
    types: ["Debugging", "Code", "System Design"],
    langs: ["Python", "Java"],
    questions: 12,
    candidates: 22,
    completed: 22,
    aiRate: 38,
    created: "2026-05-06",
  },
  {
    id: 3,
    title: "SQL Injection Trap Set",
    role: "Full-Stack",
    difficulty: "Mid",
    status: "active",
    types: ["SQL Trap", "Algorithm"],
    langs: ["SQL", "PostgreSQL"],
    questions: 20,
    candidates: 18,
    completed: 11,
    aiRate: 84,
    created: "2026-05-05",
  },
  {
    id: 4,
    title: "System Design — Senior",
    role: "Backend",
    difficulty: "Senior",
    status: "closed",
    types: ["System Design", "API Design"],
    langs: ["Any"],
    questions: 8,
    candidates: 9,
    completed: 9,
    aiRate: 21,
    created: "2026-05-03",
  },
  {
    id: 5,
    title: "Full-Stack Gauntlet",
    role: "Full-Stack",
    difficulty: "Lead",
    status: "pending",
    types: ["Code", "Debugging", "Algorithm", "System Design"],
    langs: ["JavaScript", "Python"],
    questions: 24,
    candidates: 41,
    completed: 0,
    aiRate: 0,
    created: "2026-05-11",
  },
  {
    id: 6,
    title: "Frontend React Traps",
    role: "Frontend",
    difficulty: "Junior",
    status: "draft",
    types: ["Code", "Debugging"],
    langs: ["JavaScript", "TypeScript"],
    questions: 10,
    candidates: 0,
    completed: 0,
    aiRate: 0,
    created: "2026-05-12",
  },
];

export const QUESTION_TYPES: QuestionTypeMeta[] = [
  { key: "code",   icon: "💻", label: "Coding Challenge", sub: "Implement from scratch" },
  { key: "debug",  icon: "🐛", label: "Debugging Task",   sub: "Find & fix the bug" },
  { key: "algo",   icon: "🧮", label: "Algorithm",        sub: "Efficiency-focused" },
  { key: "sysdes", icon: "🏗️", label: "System Design",   sub: "Architecture problem" },
  { key: "sql",    icon: "🗄️", label: "SQL Trap",        sub: "Query adversarial" },
  { key: "api",    icon: "🔌", label: "API Design",       sub: "REST / GraphQL" },
  { key: "logic",  icon: "🧩", label: "Logic Puzzle",     sub: "Human-reasoning" },
  { key: "review", icon: "👁️", label: "Code Review",     sub: "Find issues in code" },
];

export const PROGRAMMING_LANGUAGES: string[] = [
  "JavaScript", "TypeScript", "Python", "Java", "C++",
  "Go", "Rust", "SQL", "C#", "Kotlin",
];

export const ADVERSARIAL_TECHNIQUES: AdversarialTechnique[] = [
  { id: "misdirect", label: "Misdirection Injection",  sub: "Embeds false context to lead AI astray",   eff: "HIGH" },
  { id: "negsemant", label: "Negative Semantics Trap", sub: "Uses negation patterns that confuse LLMs", eff: "HIGH" },
  { id: "roleplay",  label: "Role-Play Anchoring",     sub: "Embeds conflicting identity constraints",  eff: "MED"  },
  { id: "tokenoise", label: "Token Noise Insertion",   sub: "Strategic typos that fool AI parsers",     eff: "MED"  },
  { id: "temporal",  label: "Temporal Confusion",      sub: "Anachronistic logic traps",                eff: "LOW"  },
  { id: "ambigpron", label: "Pronoun Ambiguity",       sub: "Referential ambiguity in problem spec",    eff: "LOW"  },
];

export const TARGET_ROLES: string[] = [
  "Frontend", "Backend", "Full-Stack", "DevOps",
  "Data Engineering", "Cloud / Infra", "Mobile",
];

export const DIFFICULTY_LEVELS = ["Junior", "Mid", "Senior", "Lead", "Architect"] as const;

export const WIZARD_STEPS = [
  { label: "BASIC INFO",  sub: "Details & role" },
  { label: "QUESTIONS",   sub: "Question types" },
  { label: "SETTINGS",    sub: "Time & proctoring" },
  { label: "REVIEW",      sub: "Deploy" },
] as const;

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",     href: "/dashboard" },
  { label: "Assessments",   href: "/assessments", active: true },
  { label: "Candidates",    href: "/candidates" },
  { label: "Question Bank", href: "/question-bank" },
  { label: "AI Analytics",  href: "/ai-analytics" },
  { label: "Reports",       href: "/reports" },
];