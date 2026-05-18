import { AssessmentCard } from "@/components/candidate/ui/cards/assesment-card";
import { mockAssessments } from "@/lib/mockData";

export default function AssessmentPage() {
    const assessments = mockAssessments;

    return (
        <main>
            <div className="mt-8">
                <h1 className="font-staatliches text-3xl text-default-text mb-2">Available Assessments</h1>
                <div>
                    <p className="font-ibm-plex text-base text-white-smoke">
                        Start an assessment with carefully curated questions.
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-x-32 gap-y-16 pt-8 pb-8">
                {assessments.map((assessment) => (
                    <AssessmentCard key={assessment.assessmentId} {...assessment} />
                ))}
            </div>
        </main>
       
    );
}