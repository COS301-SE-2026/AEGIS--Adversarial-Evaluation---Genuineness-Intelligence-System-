"use client";

interface TopbarProps {
  onNewAssessment: () => void;
}

export default function AdminTopbar({ onNewAssessment }: TopbarProps) {
  return (
    <div className="h-[60px] bg-secondary-surface border-b border-tertiary-surface flex items-center justify-between px-7 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="font-jetbrains text-[11px] text-white-smoke/40">
        ADMIN / <span className="text-system-red">ASSESSMENTS</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-5">
        {/* Bell icon */}
        <button
          aria-label="Notifications"
          className="text-white-smoke/40 hover:text-white-smoke transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* New Assessment button — matches hero "GET STARTED" solid variant */}
        <button
          onClick={onNewAssessment}
          className="flex items-center gap-2 bg-default-text text-background border border-default-text px-[18px] py-[9px] font-staatliches text-[15px] tracking-[0.05em] rounded-[5px] transition-colors duration-200 whitespace-nowrap hover:bg-transparent hover:border-system-red hover:text-system-red"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          NEW ASSESSMENT
        </button>

        {/* Avatar */}
        <div className="w-[34px] h-[34px] bg-system-red rounded-[5px] flex items-center justify-center font-staatliches text-base cursor-pointer select-none text-white">
          AD
        </div>
      </div>
    </div>
  );
}