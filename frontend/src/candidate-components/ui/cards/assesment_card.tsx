import Link from "next/link";
import Image from "next/image"; 
import { AssessmentCardProps } from "./assessment_card.types";
import { ICONS } from "@/lib/icons";


export function AssessmentCard({ assessmentId, title, description, num_questions, attempts, success_rate }: AssessmentCardProps) {
    return (
        <div className= "bg-bunker-grey border-2 border-black-wool p-4 h-20rem w-15rem">
            <div className="mb-8">
                <h2 className="text-xl mb-2 leading-6 tracking-widest">{title}</h2>
                <p className="mt-4">{description}</p>
            </div>
            <div className="flex items-center mt-2 mb-4">
                <Image src={ICONS.FILE} alt="File Icon" className="mr-2" width={24} height={24} />
                <p>Questions: {num_questions}</p>
            </div>
            <div className="flex items-center mt-2 mb-4">
                <Image src={ICONS.USERS} alt="Users Icon" className="mr-2" width={24} height={24} />
                <p>Attempted: {attempts} times</p>
            </div>
            <div className="flex items-center mt-2 mb-4">
                <Image src={ICONS.PIE_CHART} alt="Pie Chart Icon" className="mr-2" width={24} height={24} />
                <p>Success Rate: {success_rate}%</p>
            </div>
            <Link href={`/assessment/${assessmentId}`}>
                <button className= " mt-4 bg-transparent h-3rem w-8rem text-signal-red border-2 border-signal-red  px-4 py-2 hover:bg-signal-red hover:text-white-smoke transition-colors duration-300">
                    <h3 className="tracking-widest">Start</h3>
                </button>
            </Link>
        </div>
    );
}