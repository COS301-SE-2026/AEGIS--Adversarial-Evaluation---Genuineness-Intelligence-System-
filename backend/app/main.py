from fastapi import FastAPI

from app.api.routes.assessment import (
    candidate_response_router,
    router as assessment_router,
)

app = FastAPI()

# Register all API routes here
app.include_router(assessment_router, prefix="/api/v1")
app.include_router(candidate_response_router, prefix="/api/v1")


@app.get("/")
def root():
    # Replace with API status info
    return {"message": "AEGIS backend is running"}
