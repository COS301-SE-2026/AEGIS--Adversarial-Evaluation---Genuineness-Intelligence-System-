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
      {/* Search
            Default:  bg-background (#0F0F0E) + border-default-border (#989892) + text-default-text
            Focus:    border-system-red
            bg-background is the true near-black; tertiary-surface (#30302E) is the hover step up
      */}
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
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
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

      {/* Status chips
            Inactive: bg-background + border-default-border + text-default-text/60, hover bg-tertiary-surface
            Active:   bg-system-red/15 + border-system-red + text-system-red
      */}
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
                  : "bg-background border-default-border text-default-text hover:bg-tertiary-surface"
              }
            `}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Sort button — same inactive style as chips */}
      <button className="ml-auto flex items-center gap-1.5 font-jetbrains text-[10px] tracking-[0.05em] text-default-text bg-background border border-default-border px-3 py-2 rounded-[5px] cursor-pointer transition-all duration-150 hover:bg-tertiary-surface">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="6" y1="12" x2="18" y2="12" />
          <line x1="9" y1="18" x2="15" y2="18" />
        </svg>
        SORT: RECENT
      </button>
    </div>
  );
}