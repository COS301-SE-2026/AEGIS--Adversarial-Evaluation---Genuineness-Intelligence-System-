import Link from "next/link";
import Image from "next/image"; 
import { AssessmentCardProps } from "./assessment-card.types"; //icons class 
import { StartAssessmentButton } from "@/components/candidate/ui/buttons/start-assessment-button";


export function AssessmentCard({ assessmentId, title, description, num_questions, attempts, success_rate }: AssessmentCardProps) {
    return (
        <div className= "bg-secondary-surface/50 border-2 rounded-md border-tertiary-surface p-4 h-20rem w-15rem flex flex-col hover:scale-105 hover:border-system-red/75 hover:shadow-glow-red transition-all duration-300">
            <div className="mb-4 shrink-0">
                <h2 className="text-l mb-2 leading-6 tracking-widest">{title}</h2>
                <p className="mt-4 line-clamp-2">{description}</p>
            </div>
            <div className="text-sm grow">
                <div className="flex items-center mt-2 mb-4">
                    <Image src="/illustrations/icons/file-icon.svg" alt="File Icon" className="mr-2" width={24} height={24} />
                    <p>Questions: {num_questions}</p>
                </div>
                <div className="flex items-center mt-2 mb-4">
                    <Image src="/illustrations/icons/users-icon.svg" alt="Users Icon" className="mr-2" width={24} height={24} />
                    <p>Attempted: {attempts} times</p>
                </div>
                <div className="flex items-center mt-2 mb-4">
                    <Image src="/illustrations/icons/pie-chart-icon.svg" alt="Pie Chart Icon" className="mr-2" width={24} height={24} />
                    <p>Success Rate: {success_rate}%</p>
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