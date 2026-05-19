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
          className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F5F5F5"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="
            w-full bg-[#292C2F] border border-[#333331] text-[#F5F5F5]
            pl-9 pr-3 py-2 font-ibm text-[13px] rounded-[5px] outline-none
            placeholder:text-[rgba(245,245,245,0.42)]
            transition-colors duration-150 focus:border-[#D32F2F]
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
                  ? "bg-[rgba(211,47,47,0.15)] border-[#D32F2F] text-[#D32F2F]"
                  : "bg-[#292C2F] border-[#333331] text-[rgba(245,245,245,0.42)] hover:border-[rgba(245,245,245,0.3)] hover:text-[#F5F5F5]"
              }
            `}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Sort button */}
      <button className="ml-auto flex items-center gap-1.5 font-jetbrains text-[10px] text-[rgba(245,245,245,0.42)] bg-[#292C2F] border border-[#333331] px-3 py-2 rounded-[5px] cursor-pointer tracking-[0.05em] transition-all duration-150 hover:text-[#F5F5F5] hover:border-[rgba(245,245,245,0.3)]">
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