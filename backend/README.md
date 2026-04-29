# AEGIS Backend

FastAPI backend for the AEGIS system.

## Structure
- app/api/routes → API endpoints
- app/services → business logic
- app/db → database layer
- app/core → config and security

## Run server
uvicorn app.main:app --reload