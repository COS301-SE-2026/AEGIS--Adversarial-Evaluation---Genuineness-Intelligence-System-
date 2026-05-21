from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.assessment import (
    candidate_response_router,
    router as assessment_router,
)
from app.api.routes.auth import router as auth_router
from app.api.routes.user import router as user_router
from app.core.config import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(assessment_router, prefix="/api/v1")
app.include_router(candidate_response_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    env = "development" if settings.debug else "production"
    print(f"AEGIS backend started | environment: {env}")


@app.get("/")
def root():
    return {"message": "AEGIS backend is running"}
