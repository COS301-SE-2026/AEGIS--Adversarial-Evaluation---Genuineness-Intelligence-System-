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
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[320px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white-smoke/40"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="
            w-full bg-tertiary-surface border border-tertiary-surface text-white-smoke
            pl-9 pr-3 py-2 font-ibm text-[13px] rounded-[5px] outline-none
            placeholder:text-white-smoke/40
            transition-colors duration-150 focus:border-system-red
          "
          placeholder="Search assessments..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Status chips */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`
              font-jetbrains text-[10px] tracking-[0.05em] px-3 py-[5px]
              rounded-[5px] cursor-pointer border transition-all duration-150 uppercase
              ${
                filter === f
                  ? "bg-system-red/15 border-system-red text-system-red"
                  : "bg-tertiary-surface border-tertiary-surface text-white-smoke/40 hover:border-white-smoke/30 hover:text-white-smoke"
              }
            `}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Sort button */}
      <button className="ml-auto flex items-center gap-1.5 font-jetbrains text-[10px] text-white-smoke/40 bg-tertiary-surface border border-tertiary-surface px-3 py-2 rounded-[5px] cursor-pointer tracking-[0.05em] transition-all duration-150 hover:text-white-smoke hover:border-white-smoke/30">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="6" y1="12" x2="18" y2="12"/>
          <line x1="9" y1="18" x2="15" y2="18"/>
        </svg>
        SORT: RECENT
      </button>
    </div>
  );
}