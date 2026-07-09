"use client";

import { AssessmentCardProps } from "../cards/assessment-card.types";
import { StartAssessmentButton } from "../buttons/start-assessment-button";

interface AssessmentPreviewModalProps {
    assessment: Pick<AssessmentCardProps, "title" | "description" | "durationMins">;
    onClose: () => void;
    onStart: () => void;
}

const TestRules = [
    "Complete the assessment independently without outside assisstance.",
    "Do not copy, share, or distribute any assessment content.",
    "Ensure you have stable internet connection before starting.",
    "Once started, the assessment is timed and cannot be paused.",
    "Submit your answers before the timer expires"
];

export function AssessmentPreviewModal({assessment, onClose,onStart}: AssessmentPreviewModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div className="relative w-full max-h-[90vh] overflow-y-auto rounded-lg border-2 border-default-border bg-secondary-surface p-8"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-default-text opacity-50 hover:opacity-100 transition-opacity"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/200/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                <div className="mb-6">
                <h2 className="text-3xl text-default-text tracking-widest mb-2">
                    Assessment Details
                </h2>
                <div className="h-1 w-16 bg-system-red"></div>
            </div>

            <div className="mb-8">
                <h3 className="text-2xl text-default-text tracking-widest mb-3">
                    {assessment.title}
                </h3>
                <p className="text-default-text leading-relaxed mb-6">
                    {assessment.description}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 border border-default-border rounded-md p-4 bg-tertiary-surface">
                    <div className="flex items-center flex-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-white-smoke/80">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <div>
                            <p>Duration</p>
                            <p>{assessment.durationMins}</p>
                        </div>
                    </div>
                </div>
            </div>

                <div className="mb-8">
                    <h4>
                        Test Rules &amp; Instructions
                    </h4>
                    <ul className="space-y-3">
                        {TestRules.map((rule, index) => (
                            <li key={index} className="flex items-start text-sm text-default-text">
                                <span className="mr-3 mt-0.5"><b>-</b></span>
                                <span>{rule}</span>
                            </li>
                        ))}
                    </ul>
                    <span className="font-staatliches text-sm"><b>By clicking "Start Test", you acknowledge that you have read, understood, and agree to abide by these terms and conditions</b></span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-end mt-8 border-default-border pt-6">
                    <button
                        onClick={onClose}
                        className="h-12 px-6 rounded-md border-2 border-default-border text-default-text hover:bg-tertiary-surface transition-colors duration-300 cursor-pointer"
                    >
                        <h3 className="tracking-widest">Cancel</h3>
                    </button>
                    <StartAssessmentButton
                        onClick={onStart}
                    />
                </div>
            </div>
        </div>
    )
}