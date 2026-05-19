from fastapi import FastAPI

from app.api.routes.assessment import router as assessment_router
from app.api.routes.auth import router as auth_router
app = FastAPI()

# Register all API routes here
app.include_router(assessment_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")

@app.get("/")
def root():
    # Replace with API status info
    return {"message": "AEGIS backend is running"}
