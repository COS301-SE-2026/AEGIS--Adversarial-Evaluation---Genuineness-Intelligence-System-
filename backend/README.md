# AEGIS Backend

FastAPI backend for the AEGIS system with SQLAlchemy ORM and PostgreSQL.

## Architecture

- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **Authentication:** JWT

## Project Structure

```
backend/
├── app/
│   ├── init.py
│   ├── main.py                       # FastAPI app initialization
│   ├── api/
│   │   ├── init.py
│   │   └── routes/
│   │       └── init.py
│   ├── core/
│   │   ├── init.py
│   │   ├── config.py                 # Settings and environment config
│   │   └── security.py              # JWT and security utilities
│   ├── database/
│   │   ├── init.py
│   │   └── database.py              # SQLAlchemy session management
│   ├── models/
│   │   ├── init.py
│   │   ├── base.py                  # Base model for ORM
│   │   ├── user.py                  # User model
│   │   ├── question.py              # Question model
│   │   ├── assessment.py            # Assessment model
│   │   ├── candidate_assessment.py  # Candidate assessment session model
│   │   └── candidate_response.py   # Candidate response model
│   ├── schema/
│   │   ├── init.py
│   │   └── user.py                  # Pydantic validation schemas
│   └── services/
│       ├── init.py
│       └── users.py                 # Business logic layer
├── alembic/                         # Database migrations
├── alembic.ini.example              # Alembic config template
├── setup.py                         # Automated setup script
├── tests/
│   └── init.py
├── requirements.txt                 # Python dependencies
├── .env.example                     # Environment variables template
└── README.md
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the setup script:**
   ```bash
   cd backend
   python setup.py
   ```
The script will ask for the database URL — get it from a teammate.

3. **Apply database migrations:**
   ```bash
   alembic upgrade head
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
- Migrations handled by Alembic

## Next Steps (Implementation)

- [ ] Create Pydantic schemas in `app/schema/`
- [ ] Implement service layer in `app/services/`
- [ ] Create API routes in `app/api/routes/`
- [ ] Set up authentication middleware
