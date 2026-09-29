export const mockOverallPriority = {
    score: 68,
    band: "medium" as const,
    contributing_factors: [
        "Candidate pasted > 30% of code in Question 1",
        "Multiple focus loss events detected across the session"
    ]
}

export const mockQuestionAnalytics = {
    candidate_assessment_id: 42,
    questions: [
        {
            question_order:1,
            assessment_q_id: 101,
            question_bank_id: 7,
            title: "Array Rotation (Coding)",
            content: "Given an array, rotate it to the right by k steps.",
            type: "CODING" as const,
            maximum_score: 10.0,
            answered: true,
            answer: {
                candidate_answer: "def rotate(arr,k):\n     n=len(arr)\n    k = k % n\n     return arr[-k:] + arr[:-k]",
                score: 8.0,
                is_correct: "PARTIAL" as const
            },
            metrics: {
                active_time_ms: 184000,
                backspace_count: 42,
                copy_event_count: 1,
                copy_char_count: 30,
                paste_event_count: 3,
                paste_char_count: 210,
                focus_loss_count: 4,
                focus_loss_time_ms: 25000
            },
            review_score: 85,
            review_band: "high" as const,
            contributing_factors: [
                "62% of characters were pasted rather than typed.",
                "Candidate lost focus 4 times during this question"
            ]
        }
    ]
}