import { AssessmentCard } from "@/components/candidate/ui/cards/assesment_card";

export default function AssessmentPage() {
    return (
        <div className="flex items-start justify-center min-h-screen gap-4 p-4">
            <AssessmentCard assessmentId={1} title="Test Assessment" description="This is the first assessment" num_questions={10} attempts={3} success_rate={80.97} />
        </div>
    );
}