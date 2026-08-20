import { InfoCard } from "@/components/candidate/ui/cards/report-info-card";
import { TopPerformer } from "@/types/dashboard-types";
import { AssessmentCandidateTableContainer } from "@/components/admin/ui/dashboard/assessment-candidate-table-container";

interface AssessmentPageProps {
  params: Promise<{
    assessment_id: string;
  }>;
}

const topPerformers: TopPerformer[] = [
  {
    candidate_name: "Luyanda Ndlovu",
    score_percent: 98,
  },
  {
    candidate_name: "Lesedi Matena",
    score_percent: 97,
  },
  {
    candidate_name: "Ownen Mason",
    score_percent: 93,
  }
]

export default async function AssessmentPage( { params, }: AssessmentPageProps ) {
  const { assessment_id } = await params;
  const assessmentId = Number(assessment_id);
  
  return (
    <section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <InfoCard
          type="ranking"
          title="Top Performers" 
          items={topPerformers.map((candidate) => ({
            name: candidate.candidate_name,
            value: candidate.score_percent,
          }))} 
          icon="trophy"
        />
        
        <InfoCard 
          type="duration"
          title="Average Completion Time" 
          value={400} 
          icon="chart"
        />
          
        <InfoCard 
          type="percentage"
          title="Assessment Average"
          value={70}
          icon="chart"
        />

        <InfoCard 
          type="percentage"
          title="AI Usage"
          value={2.49}
          label="LOW"
          icon="ai"
        />
      </div>

      <div className="flex flex-col justify-between gap-12 rounded-xl mt-8">

        <div className="mb-4">
          <AssessmentCandidateTableContainer assessmentId={assessmentId}/>
        </div>

      </div>

    </section>
  );
}
