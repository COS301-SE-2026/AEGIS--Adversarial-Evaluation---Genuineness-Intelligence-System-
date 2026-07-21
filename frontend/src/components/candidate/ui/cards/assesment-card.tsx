"use client";

import Image from "next/image"; 
import { AssessmentCardProps } from "./assessment-card.types"; //icons class 
import { StartAssessmentButton } from "@/components/candidate/ui/buttons/start-assessment-button";
import { apiPost } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

function formatStatus(status: string): string {
    return status.replace(/_/g, " ").toUpperCase();
}

export function AssessmentCard({
    candidateAssessId,
    accessToken,
    title,
    description,
    durationMins,
    status,
}: AssessmentCardProps) {
    const router = useRouter();
    const [isStarting, setIsStarting] = useState(false);
    const [startError, setStartError] = useState<string|null>(null);

    async function handleStart() {
        if (isStarting || accessToken) {
            if (!accessToken) setStartError("Missing access token");
        };
        try {
            setIsStarting(true);
            setStartError(null);
            const authToken = getToken() ?? undefined;

            await apiPost(
                `/api/v1/assessments/take/${accessToken}/start`,
                undefined,
                authToken ? { authToken } : {}
            );
            router.push(`/assessment/${candidateAssessId}`);
        } catch (error) {
            const errorMessage = error instanceof Error? error.message : "Assessment is not ready yet";
            setStartError(errorMessage);
        } finally {
            setIsStarting(false);
        }
    }


    return (
        <div className= "flex flex-col h-full min-h-88 bg-secondary-surface/50 border-2 rounded-md border-tertiary-surface p-4 h-20rem w-15rem  hover:scale-105 hover:border-default-text/75 hover:shadow-default-text/60 transition-all duration-300">
            <div className="mb-4 shrink-0">
                <h2 className="text-l mb-2 leading-6 tracking-widest">{title}</h2>
                <p className="mt-4 line-clamp-2">{description}</p>
            </div>
            <div className="text-sm grow">
                <div className="flex items-center mt-2 mb-4">
                    <Image
                        src="/illustrations/icons/file-icon.svg"
                        alt="File Icon"
                        className="mr-2 brightness-0 invert"
                        width={24}
                        height={24}
                    />
                    <p>Duration: {durationMins} mins</p>
                </div>
                <div className="flex items-center mt-2 mb-4">
                    <Image
                        src="/illustrations/icons/users-icon.svg"
                        alt="Users Icon"
                        className="mr-2 brightness-0 invert"
                        width={24}
                        height={24}
                    />
                    <p>Status: {formatStatus(status)}</p>
                </div>
            </div>
            <div className="mt-auto">
                <StartAssessmentButton onClick={handleStart} disabled={isStarting} isStarting={isStarting}/>
                {startError && (
                    <p className="mt-2 text-sm text-system-red">{startError}</p>
                )}
            </div>

        </div>
    );
}