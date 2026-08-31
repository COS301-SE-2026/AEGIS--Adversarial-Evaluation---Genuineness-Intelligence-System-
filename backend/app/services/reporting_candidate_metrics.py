from app.schema.review_priority import ReviewPriorityResponse


def get_review_priority(
        candidate_assessment_id: int
) -> ReviewPriorityResponse:
    return ReviewPriorityResponse(
        score=0,
        band="low",
        contributing_factors=[]
    )
