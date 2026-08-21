
import { useQuery } from "@tanstack/react-query";
// import { apiGet } from "@/lib/apiClient";
// import { getAuthHeaders } from "@/lib/auth";
import { AssessmentAnalyticsTable, AssessmentAnalyticsTableItems  } from "@/types/dashboard-types";

const MOCK_ANALYTICS_TABLE_ITEMS_DATA: AssessmentAnalyticsTableItems[] = [
    { 
        assessment_id: 1,
        name: "Test Assessment",
        average_score_percent: 70.67,
        top_candidate_name: "Luyanda Ndlovu"
        
    },
    { 
        assessment_id: 2,
        name: "Test Assessment 2",
        average_score_percent: 50.00,
        top_candidate_name: "Lesedi Matena"
    },
]

const MOCK_ANALYTICS_TABLE_DATA: AssessmentAnalyticsTable = {
        items: MOCK_ANALYTICS_TABLE_ITEMS_DATA,
        page: 1,
        page_size: 8,
}



export function useDashboardTable() {
    return useQuery<AssessmentAnalyticsTable>({
        queryKey: ["dashboard-table-assessments"],

        queryFn: async () => {

            //temporary data mock before api is implemented
            return MOCK_ANALYTICS_TABLE_DATA;
        },


        // queryFn: ({ signal }) => 
        //     apiGet<AssessmentAnalyticsTable>(
        //         "/api/v1/admin/dashboard/assessments",
        //          {
        //             headers: getAuthHeaders(),
        //             signal,
        //         }
        //     ),
           
        refetchInterval: 10_000, //polls every 10s
        
        refetchIntervalInBackground: false, //stops polling when user changes tabs
    })
}