"use client"

import Link from "next/link";
import Image from "next/image"; 
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AssessmentCardProps } from "./assessment-card.types"; //icons class 
import { StartAssessmentButton } from "@/components/candidate/ui/buttons/start-assessment-button";
import { AssessmentPreviewModal } from "../modals/assessment-preview-modal";


function formatStatus(status: string): string {
    return status.replace(/_/g, " ").toUpperCase();
}

export function AssessmentCard({
    candidateAssessId,
    title,
    description,
    durationMins,
    status,
}: AssessmentCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleStart = () => {
        setIsModalOpen(false);
        router.push(`assessment/${candidateAssessId}`);
    };

    return (
        <div className= "bg-secondary-surface/50 border-2 rounded-md border-tertiary-surface p-4 h-20rem w-15rem flex flex-col hover:scale-105 hover:border-default-text/75 hover:shadow-default-text/60 transition-all duration-300">
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
                <StartAssessmentButton
                    onClick={()=> setIsModalOpen(true)}
                />
            </div>
            
            {isModalOpen && (
                <AssessmentPreviewModal
                    assessment={{title, description, durationMins}}
                    onClose={()=> setIsModalOpen(false)}
                    onStart={handleStart}
                />
            )}
        </div>
    )
}   