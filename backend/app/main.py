from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.adversarial import (
    adversarial_questions_router,
    assessment_adversarial_router,
    question_adversarial_router,
    router as adversarial_router,
)
from app.api.routes.assessment import (
    candidate_response_router,
    router as assessment_router,
)
from app.api.routes.auth import router as auth_router
from app.api.routes.user import router as user_router
from app.api.routes.question import router as question_router2, category_router
from app.api.routes.test_cases import router as test_cases_router
from app.core.config import settings

from app.api.routes.question_management import router as question_router
from app.api.routes.candidate_ass import (
    router as candidate_assessment_router,
    metrics_router as candidate_response_metrics_router,
)
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.metrics import router as metrics_router
from app.api.routes.candidate_report import router as candidate_report_router

app = FastAPI()

API_V1_PREFIX = "/api/v1"

origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "https://aegis-cos301.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex="https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=API_V1_PREFIX)
app.include_router(assessment_router, prefix=API_V1_PREFIX)
app.include_router(candidate_response_router, prefix=API_V1_PREFIX)
app.include_router(user_router, prefix=API_V1_PREFIX)
app.include_router(question_router2, prefix=API_V1_PREFIX)
app.include_router(question_router, prefix=API_V1_PREFIX)
app.include_router(test_cases_router, prefix=API_V1_PREFIX)
app.include_router(category_router, prefix=API_V1_PREFIX)
app.include_router(candidate_assessment_router, prefix=API_V1_PREFIX)
app.include_router(candidate_response_metrics_router, prefix=API_V1_PREFIX)
app.include_router(adversarial_router, prefix=API_V1_PREFIX)
app.include_router(assessment_adversarial_router, prefix=API_V1_PREFIX)
app.include_router(question_adversarial_router, prefix=API_V1_PREFIX)
app.include_router(adversarial_questions_router, prefix=API_V1_PREFIX)
app.include_router(dashboard_router, prefix=API_V1_PREFIX)
app.include_router(metrics_router, prefix=API_V1_PREFIX)
app.include_router(candidate_report_router, prefix=API_V1_PREFIX)


@app.on_event("startup")
async def startup_event():
    env = "development" if settings.debug else "production"
    print(f"AEGIS backend started | environment: {env}")


@app.get("/")
def root():
    return {"message": "AEGIS backend is running"}
