"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssessmentCardProps } from "./assessment-card.types";
import { StartAssessmentButton } from "@/components/candidate/ui/buttons/start-assessment-button";
import { apiPost } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";
import { AssessmentPreviewModal } from "../modals/assessment-preview-modal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function handleStart() {
    if (isStarting) return;
    if(!accessToken) {
        console.error("Missing access token");
      return;
    }
    try {
      setIsStarting(true);
      const authToken = getToken() ?? undefined;
      await apiPost(
        `/api/v1/assessments/take/${accessToken}/start`,
        undefined,
        authToken ? { authToken } : {}
      );
      router.push(`/assessment/${candidateAssessId}`);
    } catch (error) {
        console.error("Failed to start assessment")
      setIsStarting(false);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-88 bg-secondary-surface/50 border-2 rounded-md border-tertiary-surface p-4 h-20rem w-15rem hover:scale-105 hover:border-default-text/75 hover:shadow-default-text/60 transition-all duration-300">
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
      <div className="inline-block">
        <StartAssessmentButton
          onClick={() => setIsModalOpen(true)}
          disabled={status.toUpperCase() === "COMPLETED" || status.toUpperCase() === "EXPIRED"}
        />
      </div>
      {isModalOpen && (
        <AssessmentPreviewModal
          assessment={{title, description, durationMins}}
          onClose={() => setIsModalOpen(false)}
          onStart={handleStart}
          isStarting={isStarting}
        />
      )}
    </div>
  )
}