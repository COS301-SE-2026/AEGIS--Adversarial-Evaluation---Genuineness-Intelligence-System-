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

## Local Development Sandbox Setup

We use **Piston** to securely execute untrusted Python code in an isolated Docker container.

### Prerequisites

- Docker Desktop or Docker Engine
- Docker Compose
- A running Docker daemon

### 1. Start the Piston sandbox

From the repository root, start the sandbox container:

```bash
cd sandbox
docker compose up -d
```

The compose file defaults to `linux/amd64` for broad compatibility. If a machine needs a different platform, set `PISTON_PLATFORM` before starting the container.

### 2. Verify the sandbox API

Check that the Piston API is online:

```bash
curl http://localhost:2000/api/v2/runtimes
```

If Python has not been installed yet, the runtime list will be empty. Install the Python runtime using the Piston CLI:

```bash
git clone https://github.com/engineer-man/piston /tmp/piston
cd /tmp/piston/cli
npm install
node index.js -u http://localhost:2000 ppman install python
```

After installation, `curl http://localhost:2000/api/v2/runtimes` should list a Python runtime such as `3.12.0`.

### 3. Code execution test
Run a simple Python program through the sandbox:

```bash
curl -X POST http://localhost:2000/api/v2/execute \
   -H "Content-Type: application/json" \
   -d '{
      "language": "python",
      "version": "3.12.0",
      "files": [
         {
            "name": "main.py",
            "content": "print(input())"
         }
      ],
      "stdin": "hello"
   }'
```
If the sandbox is configured correctly, the response will return `hello` in the `run.stdout` field.

## Database

- PostgreSQL 15
- Managed with SQLAlchemy ORM
- Migrations handled by Alembic

## Next Steps (Implementation)

- [ ] Create Pydantic schemas in `app/schema/`
- [ ] Implement service layer in `app/services/`
- [ ] Create API routes in `app/api/routes/`
- [ ] Set up authentication middleware
