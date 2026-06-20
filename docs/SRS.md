## Introduction

AEGIS is where AI fights AI.

The project explores adversarial machine learning within technical assessments by researching how AI models respond to deceptive or reasoning-heavy prompts. The platform investigates techniques that can cause AI systems to hallucinate, contradict themselves, misinterpret constraints, or generate confidently incorrect answers.

The rapid advancement of Large Language Models (LLMs) has significantly transformed how technical knowledge is accessed, applied, and evaluated. While these models provide powerful assistance in software development and problem-solving, they have also introduced new challenges in academic and industry assessment environments, particularly regarding the authenticity of candidate responses during technical evaluations.

AEGIS (Adversarial Evaluation Genuineness Intelligence System) is an adversarial AI-driven assessment platform designed to address this emerging problem. The system explores how modern LLMs reason, fail, and can be manipulated through carefully engineered adversarial prompts. Its primary objective is to generate assessment questions that remain solvable by human candidates while deliberately exposing weaknesses in AI-generated responses.

The platform integrates adversarial machine learning principles with technical assessment workflows, enabling the creation, management, and evaluation of structured assessments across multiple question types, including coding challenges, system design problems, debugging tasks, and reasoning-based questions.

---
## Domain Model

The domain model can be found here:

[View Domain Model Diagram (PDF)](DomainModel.pdf)

---

## User Characteristics

AEGIS is designed for two primary user types: Candidates (Users) and Recruiters (Admins). Each user interacts with the system in a distinct way based on their role within the assessment platform.

---

### Candidate (User)

The Candidate is the primary end-user of the system. This user interacts with AI-generated adversarial assessments.

**Characteristics:**
- Completes technical assessments
- Interacts with ambiguous and adversarial questions
- Requires a structured interface for answering questions

**System Usage:**
- Start and complete assessments
- Navigate between questions
- Answer multiple choice scenario-based questions
- View timer during assessments
- Save and resume progress

---

### Recruiter (Admin)

The Admin is responsible for managing assessments.

**Characteristics:**
- Assigns assessments to candidates.

**System Usage:**
- Assign predefined assessments to specific candidates.

---

## Use Cases

The system supports the following high-level use cases:

---

### Use Case 1: Assign An Assessment (Admin)
An administrator assigns an assessment with predefined questions to a specific candidate.

### Use Case 2: Complete Assessment
A candidate completes a structured assessment consisting of adversarial questions. The assessment includes navigation, timing, and multiple question formats.

### Use Case 3: Save Assessment Progress
A candidate can save assessment progress. The system automatically persists responses to a database.

---

## Use Case Diagram

The diagram includes interactions between:
- Candidate (User)
- Recruiter (Admin)

The full use case documentation can be found here:

[View Use Case Diagram (PDF)](UseCases.drawio.pdf)

---

## Functional Requirements

The functional requirements are grouped into subsystems based on system architecture.

---

## Subsystem 1: Assessment Engine

FR1. The system shall allow a candidate to start an assessment.  
FR2. The system shall present questions from the predefined assessment with questions from the question bank.  
FR3. The system shall support multiple question types including:
- Fill-in-the-blank
- Multiple Choice Questions 

FR4. The system shall allow navigation between questions.  
FR5. The system shall display a timer during assessments.  

---

## Subsystem 2: Progress Management

FR6. The system shall save assessment progress when a user navigates to the next question.
FR7. The system shall persist user responses in a database.

---

## Subsystem 3: Assessment Management (Admin)

FR8. The system shall allow assignment of assessments to specific users.

---

## API Services Contracts

The API Service Contract can be found here:

[View API Service Contracts(PDF)](FastAPI-Swagger.pdf)

---


## Architectural Requirements

---

## Quality Requirements

### Security

---

**Authentication enforcement**: Protected backend resources require JWT-based authentication before access is granted. FastAPI dependency injection is used to enforce authentication centrally, ensuring that unauthorized requests are rejected automatically with HTTP 401 responses when tokens are missing, expired, or invalid.

**Password hashing**: User passwords are never stored in plain text. Passwords are hashed using the bcrypt algorithm through Passlib’s CryptContext. Input validation enforces minimum password complexity requirements, including length, uppercase characters, digits, and special characters, before credentials are accepted.

**JWT signing**: Authentication tokens are signed using the HS256 algorithm with a secret key loaded securely from environment variables at application startup. Invalid or expired tokens are rejected during verification to prevent unauthorized access.

**CORS policy**: The backend uses a controlled CORS configuration to allow secure communication between the frontend and backend applications hosted on different origins while still permitting authenticated requests containing authorization headers.

---

### Maintainability

The system follows a layered architecture that separates routing, business logic, and data access responsibilities. This modular structure improves maintainability by isolating changes to specific layers of the application. Database schema modifications, for example, are generally limited to the data and service layers without requiring changes to API handlers.

Application configuration is centralized through a typed settings management system based on pydantic-settings. Environment variables are validated during application startup, allowing configuration errors to be detected early rather than during runtime.

---

### Architectural Pattern

AEGIS follows a two-tier client-server architecture.

The frontend, implemented using Next.js, executes in the client browser and is responsible for rendering the user interface, handling user interactions, and performing client-side validation.

The backend, implemented using FastAPI, manages business logic, authentication, data persistence, and security enforcement. Communication between the frontend and backend occurs through a RESTful JSON API, ensuring clear separation of concerns between presentation and application logic.

---

### Design Patterns


### Singleton

A singleton configuration object is used to manage application settings. The configuration is instantiated once during application startup and shared across the backend through module imports. This ensures consistent access to environment variables and avoids repeated configuration loading.

### Observer

The frontend uses the observer pattern through React event handling mechanisms. Components subscribe to browser events and react dynamically to state changes, such as closing interactive UI elements when user actions occur outside component boundaries.

---

### Constraints


### POPIA Act

**POPIA compliance**: AEGIS processes sensitive candidate information, including names, email addresses, and assessment responses. The system must therefore comply with the Protection of Personal Information Act (POPIA). This constrains how personal data may be stored, processed, and transmitted, particularly regarding future integrations with external AI services. Candidate-identifiable information may not be shared with third-party AI providers without appropriate safeguards and compliance measures.

**Alembic migrations out of sync with Supabase**: The current database migration history is not fully synchronized with the live Supabase database schema. As a result, future schema changes require careful reconciliation between ORM models and migration scripts before deployment to prevent schema inconsistencies or data integrity issues.


