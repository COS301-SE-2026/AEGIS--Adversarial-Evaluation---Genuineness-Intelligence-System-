from fastapi import FastAPI

app = FastAPI()

# Register all API routes here

@app.get("/")
def root():
    #Replace with API status info
    return {"message": "AEGIS backend is running"}