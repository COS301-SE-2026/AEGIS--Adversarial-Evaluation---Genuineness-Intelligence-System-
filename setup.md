Database Schema & Migration Guide

Follow these steps to sync your local environment with the latest database schema and migrations.

1. Environment Configuration

Since the .env file is ignored by Git for security, you must create it manually in your root directory.

# Create the .env file


Request the connection string from the group chat.


2. Infrastructure Setup

Ensure your local PostgreSQL instance is running via Docker.

# Start the database container
docker-compose up -d


Note: If you have a local PostgreSQL service running on your host machine, stop it to avoid conflicts on port 5432.

3. Syncing the Schema (Teammate Workflow)

Since the migrations already exist in the prisma/migrations folder, you should not create new ones. Instead, "deploy" the existing ones to your local database.

# Apply existing migrations to your local DB
npx prisma migrate deploy

# Generate the Prisma Client types for your IDE
npx prisma generate


4. Verification

Verify that your tables were created correctly by launching Prisma Studio.

# Open the database GUI
npx prisma studio


This will open http://localhost:5555 in your browser. You should see the following models:

User

Question

Assessment

AssessmentQuestion

CandidateSession

Answer