from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth
from app.core.config import settings

app = FastAPI()

# CORS — allow browser clients on configured origins to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routes here
app.include_router(auth.router, prefix="/api/v1")


# Startup event — runs once when uvicorn finishes loading
@app.on_event("startup")
async def startup_event():
    env = "development" if settings.debug else "production"
    print(f"AEGIS backend started | environment: {env}")


@app.get("/")
def root():
    # Replace with API status info
    return {"message": "AEGIS backend is running"}
