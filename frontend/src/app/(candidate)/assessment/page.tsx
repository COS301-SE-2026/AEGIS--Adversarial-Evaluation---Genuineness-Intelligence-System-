import { AssessmentCard } from "@/components/candidate/ui/cards/assesment_card";


export default function AssessmentPage() {

    const assessments = [
        { assessmentId: 1, title: "Test Assessment", description: "This is the first assessment", num_questions: 10, attempts: 3, success_rate: 80.97 },
        { assessmentId: 2, title: "JavaScript Basics", description: "Fundamentals of JavaScript programming", num_questions: 15, attempts: 2, success_rate: 92.5 },
        { assessmentId: 3, title: "React Fundamentals", description: "Core concepts of React framework", num_questions: 12, attempts: 1, success_rate: 88.33 },
        { assessmentId: 4, title: "CSS Advanced", description: "Advanced CSS styling techniques", num_questions: 20, attempts: 4, success_rate: 75.0 },
        { assessmentId: 5, title: "TypeScript Essentials", description: "TypeScript type system and features", num_questions: 14, attempts: 2, success_rate: 85.71 },
        { assessmentId: 6, title: "SQL Queries", description: "Database querying and optimization", num_questions: 18, attempts: 3, success_rate: 77.78 },
        { assessmentId: 7, title: "Web Security", description: "Security best practices for web apps", num_questions: 16, attempts: 5, success_rate: 68.75 },
        { assessmentId: 8, title: "Performance Optimization", description: "Optimizing web application performance", num_questions: 13, attempts: 2, success_rate: 84.62 },
    ];

    return (
        <main>
            <div className="mt-8">
                <h1 className="font-staatliches text-3xl text-white-smoke mb-2">Available Assessments</h1>
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