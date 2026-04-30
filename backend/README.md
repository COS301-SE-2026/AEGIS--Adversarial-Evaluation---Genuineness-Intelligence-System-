# AEGIS Backend

FastAPI backend for the AEGIS system with SQLAlchemy ORM and PostgreSQL.

## Architecture

- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Authentication:** JWT

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       └── users.py        # User endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Settings and environment config
│   │   └── security.py         # JWT and security utilities
│   ├── database/
│   │   ├── __init__.py
│   │   └── database.py         # SQLAlchemy session management
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py             # Base model for ORM
│   │   └── user.py             # User SQLAlchemy model
│   ├── schema/
│   │   ├── __init__.py
│   │   └── user.py             # Pydantic validation schemas
│   └── services/
│       ├── __init__.py
│       └── users.py            # Business logic layer
├── tests/
│   └── __init__.py
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
└── README.md
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and settings
   ```

3. **Run database (Docker):**
   ```bash
   docker-compose up -d
   ```

4. **Start development server:**
   ```bash
   uvicorn app.main:app --reload
   ```

Server will be available at: `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## Database

- PostgreSQL 15
- Managed with SQLAlchemy ORM
- Migrations handled by Alembic (to be set up)

## Next Steps (Implementation)

- [ ] Implement SQLAlchemy models in `app/models/`
- [ ] Create Pydantic schemas in `app/schema/`
- [ ] Implement service layer in `app/services/`
- [ ] Create API routes in `app/api/routes/`
- [ ] Set up authentication middleware
- [ ] Create database migrations with Alembic