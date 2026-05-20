import Link from "next/link";
import Image from "next/image"; 
import { AssessmentCardProps } from "./assessment-card.types"; //icons class 
import { StartAssessmentButton } from "@/components/candidate/ui/buttons/start-assessment-button";


function formatStatus(status: string): string {
    return status.replace(/_/g, " ").toUpperCase();
}

function formatDate(value?: string | null): string {
    if (!value) {
        return "Not started";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "Not scheduled";
    }

    return date.toLocaleString();
}

export function AssessmentCard({
    assessmentId,
    title,
    description,
    durationMins,
    status,
    startTime,
    endTime,
}: AssessmentCardProps) {
    const windowLabel = startTime || endTime
        ? `${formatDate(startTime)} - ${formatDate(endTime)}`
        : "Not scheduled";

    return (
        <div className= "bg-secondary-surface/50 border-2 rounded-md border-tertiary-surface p-4 h-20rem w-15rem flex flex-col hover:scale-105 hover:border-system-red/75 hover:shadow-glow-red transition-all duration-300">
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
                <Link href={`/assessment/${assessmentId}`}>
                    <StartAssessmentButton />
                </Link>
            </div>

        </div>
    );
}