"use client";

type FilterValue = "all" | "active" | "closed" | "pending" | "draft";

interface AssessmentFilterBarProps {
  filter: FilterValue;
  search: string;
  onFilterChange: (f: FilterValue) => void;
  onSearchChange: (s: string) => void;
}

const FILTER_OPTIONS: FilterValue[] = ["all", "active", "closed", "pending", "draft"];

export default function AssessmentFilterBar({
  filter,
  search,
  onFilterChange,
  onSearchChange,
}: AssessmentFilterBarProps) {
  return (
    <div className="flex items-center gap-2.5 mb-5 flex-wrap">
      <div className="relative flex-1 min-w-50 max-w-[320px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white-smoke/40"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          title="Search for assessments by title or keywords."
          className="
            w-full bg-background border border-default-border text-default-text
            pl-9 pr-3 py-2 font-jetbrains text-[11px] tracking-[0.04em] rounded-[5px] outline-none
            placeholder:text-white-smoke/40
            transition-colors duration-150
            hover:bg-tertiary-surface
            focus:border-system-red focus:bg-background
          "
          placeholder="Search assessments..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}