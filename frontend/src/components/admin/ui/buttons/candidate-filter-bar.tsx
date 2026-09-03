"use client";

type FilterValue = string;

interface CandidateFilterBarProps {
  search: string;
  onSearchChange: (s: string) => void;
  roleFilter: FilterValue;
  onRoleChange: (r: FilterValue) => void;
  roleOptions: FilterValue[];
  statusFilter: FilterValue;
  onStatusChange: (s: FilterValue) => void;
  statusOptions: FilterValue[];
}

export default function CandidateFilterBar({
  search,
  onSearchChange,
  roleFilter,
  onRoleChange,
  roleOptions,
  statusFilter,
  onStatusChange,
  statusOptions,
}: CandidateFilterBarProps) {
  return (
    <div className="flex flex-col gap-2.5 mb-5">
            <div className="flex items-center gap-2.5 flex-wrap">
        {/* Search */}
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
            title="Search candidates by name or email."
            className="
              w-full bg-background border border-default-border text-default-text
              pl-9 pr-3 py-2 font-jetbrains text-[11px] tracking-[0.04em] rounded-[5px] outline-none
              placeholder:text-white-smoke/40
              transition-colors duration-150
              hover:bg-tertiary-surface
              focus:border-system-red focus:bg-background
            "
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Role chips
        <div className="flex gap-1.5 flex-wrap">
          {roleOptions.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => onRoleChange(r)}
              className={`
                font-jetbrains text-[10px] tracking-wider px-3 py-1.25
                rounded-[5px] cursor-pointer border transition-all duration-150 uppercase
                ${
                  roleFilter === r
                    ? "bg-system-red/15 border-system-red text-system-red"
                    : "bg-background border-default-border text-default-text hover:bg-tertiary-surface"
                }
              `}
            >
              {r}
            </button>
          ))}
        </div> */}

        {/* <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-jetbrains text-[9px] text-white-smoke/40 tracking-wider uppercase mr-1">
          Status
        </span>
        {statusOptions.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => onStatusChange(s)}
            className={`
              font-jetbrains text-[10px] tracking-wider px-3 py-1.25
              rounded-[5px] cursor-pointer border transition-all duration-150 uppercase
              ${
                statusFilter === s
                  ? "bg-system-red/15 border-system-red text-system-red"
                  : "bg-background border-default-border text-default-text hover:bg-tertiary-surface"
              }
            `}
          >
            {s}
          </button>
        ))}
      </div> */}
      
      </div>
    </div>
  );
}