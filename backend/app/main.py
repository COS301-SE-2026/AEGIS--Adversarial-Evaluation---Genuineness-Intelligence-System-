from fastapi import FastAPI

from app.api.routes.auth import router as auth_router

app = FastAPI()

# Register all API routes here
app.include_router(auth_router, prefix="/api")


@app.get("/")
def root():
    # Replace with API status info
    return {"message": "AEGIS backend is running"}
