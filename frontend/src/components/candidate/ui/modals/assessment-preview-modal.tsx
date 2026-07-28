"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom"; // will allow for a full screen modal
import { AssessmentCardProps } from "../cards/assessment-card.types";
import { StartAssessmentButton } from "../buttons/start-assessment-button";

interface AssessmentPreviewModalProps {
  assessment: Pick<
    AssessmentCardProps,
    "title" | "description" | "durationMins"
  >;
  onClose: () => void;
  onStart: () => void;
}

const TestRules = [
  "Complete the assessment independently without outside assisstance.",
  "Do not copy, share, or distribute any assessment content.",
  "Ensure you have stable internet connection before starting.",
  "Once started, the assessment is timed and cannot be paused.",
  "Submit your answers before the timer expires",
];

export function AssessmentPreviewModal({
  assessment,
  onClose,
  onStart,
}: AssessmentPreviewModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="fixed inset-0 z-9998 bg-background/80 backdrop-blur-sm cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assessment-preview-title"
        className="flex items-center justify-center p-4 sm:p-6 fixed inset-0 z-9999"
      >
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border-2 border-default-border bg-background p-6 sm:p-8 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-default-text opacity-50 hover:opacity-100 p-2 transition-opacity"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/200/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="mb-6 shrink-0">
            <h2 className="text-3xl text-default-text tracking-widest mb-2">
              Assessment Details
            </h2>
            <div className="shrink-0 border-t border-default-border rounded-full"></div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-6 min-h-0">
            <div className="space-y-2">
              <h3 className="text-2xl text-default-text tracking-widest mb-3">
                {assessment.title}
              </h3>
              <p className="text-default-text leading-relaxed mb-6">
                {assessment.description}
              </p>
            </div>

            <div className="flex items-center border border-status-success/80 rounded-md p-4 w-36">
              <div className="flex items-center flex-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-3 text-default-text mb-5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <p>Duration</p>
                  <p>
                    {(() => {
                      const mins = assessment.durationMins;
                      if (mins < 60) return `${mins} min`;

                      const hours = Math.floor(mins / 60);
                      const remainderMins = mins % 60;

                      return remainderMins > 0
                        ? `${hours}H ${remainderMins}min`
                        : `${hours}H`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-medium text-default-text">
              Test Rules &amp; Instructions
            </h4>
            <ul className="space-y-3">
              {TestRules.map((rule, index) => (
                <li
                  key={index}
                  className="flex items-start text-sm text-default-text leading-relaxed"
                >
                  <span className="mr-3 mt-0.5">
                    <b>-</b>
                  </span>
                  <span className="wrap-break-words">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="shrink-0 border-t border-default-border mt-4 pt-4">
            <span className="text-sm text-default-text italic mb-4 leading-normal">
              By clicking <strong>Start</strong>, you acknowledge that you have
              read, understood, and agree to abide by these terms and conditions
            </span>

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end items-center">
              <button
                onClick={onClose}
                className="flex items-center justify-center w-full sm:w-auto h-11 px-6 rounded-md border-2 border-default-border text-default-text hover:bg-tertiary-surface font-staatliches font-medium sm:text-base tracking-wider transition-colors duration-300 cursor-pointer"
              >
                Cancel
              </button>

              <div className="w-full sm:w-auto flex justify-center sm:block sm:-mt-4">
                <StartAssessmentButton onClick={onStart} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body, // this will put this element cleanly into the apps root layer
  );
}
