import { InfoCard } from "@/components/candidate/ui/cards/report-info-card";
import { AssessmentCandidateTableContainer } from "@/components/admin/ui/dashboard/assessment-candidate-table-container";

interface AssessmentPageProps {
  params: Promise<{
    assessment_id: string;
  }>;
}

export default async function AssessmentPage( { params, }: AssessmentPageProps ) {
  const { assessment_id } = await params;
  const assessmentId = Number(assessment_id);
  
  return (
    <section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        
        

      </div>

      <div className="flex flex-col justify-between gap-12 rounded-xl mt-8">

        <div className="mb-4">
          <AssessmentCandidateTableContainer assessmentId={assessmentId}/>
        </div>

      </div>

    </section>
  );
}
