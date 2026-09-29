"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  readonly title: string;
  readonly pattern?: string | null;
  readonly content: string;
  readonly onClose: () => void;
}

export default function QuestionContentModal({
  title,
  pattern,
  content,
  onClose,
}: Props) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close question"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-content-modal-title"
        className="relative z-[60] w-full max-w-2xl max-h-[80vh] flex flex-col bg-secondary-surface border border-tertiary-surface rounded-[6px] overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.65)]"
      >
        <div className="px-6 py-4 border-b border-tertiary-surface flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div
              id="question-content-modal-title"
              className="font-staatliches text-[20px] tracking-[0.07em] leading-tight text-white-smoke"
            >
              {title}
            </div>
            {pattern && (
              <span className="inline-block mt-2 font-jetbrains text-[9px] px-2 py-0.5 bg-tertiary-surface rounded uppercase tracking-wide text-white-smoke/60">
                {pattern}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-white-smoke/40 hover:text-system-red transition-colors duration-150 cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="font-ibm text-[13px] leading-relaxed text-white-smoke/90 whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}