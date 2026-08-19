
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { AssessmentCandidatesResponse, AssessmentCandidateResult } from "@/types/dashboard-types";

const MOCK_CANDIDATE_TABLE_ITEMS_DATA: AssessmentCandidateResult[] = [
    { 
        candidate_id: 1,
        candidate_name: "Luyanda Ndlovu",
        total_score_percent: 93,
        status: "PASS",
        ai_rating_percent: 1,
        
    },
    { 
        candidate_id: 2,
        candidate_name: "Lesedi Matena",
        total_score_percent: 84,
        status: "PASS",
        ai_rating_percent: 3,
        
    },
]

const MOCK_CANDIDATE_TABLE: AssessmentCandidatesResponse = {
        items: MOCK_CANDIDATE_TABLE_ITEMS_DATA,
        total: 2,
}


export function useAssessmentCandidate(assessment_id: number) {
    return useQuery<AssessmentCandidatesResponse>({
        queryKey: ["dashboard-table-candidates"],

        queryFn: async () => {

            //temporary data mock before api is implemented
            return MOCK_CANDIDATE_TABLE;
        },


        // queryFn: ({ signal }) => 
        //     apiGet<AssessmentAnalyticsTable>(
        //         `/api/v1/admin/dashboard/assessments/${assessmentId}/candidates`,
        //          {
        //             headers: getAuthHeaders(),
        //             signal,
        //         }
        //     ),
           
        refetchInterval: 10_000, //polls every 10s
        
        refetchIntervalInBackground: false, //stops polling when user changes tabs
    })
}