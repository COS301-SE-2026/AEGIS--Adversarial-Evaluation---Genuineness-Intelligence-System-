## Introduction

AEGIS is where AI fights AI.

The project explores adversarial machine learning within technical assessments by researching how AI models respond to deceptive or reasoning-heavy prompts. The platform investigates techniques that can cause AI systems to hallucinate, contradict themselves, misinterpret constraints, or generate confidently incorrect answers.

The rapid advancement of Large Language Models (LLMs) has significantly transformed how technical knowledge is accessed, applied, and evaluated. While these models provide powerful assistance in software development and problem-solving, they have also introduced new challenges in academic and industry assessment environments, particularly regarding the authenticity of candidate responses during technical evaluations.

AEGIS (Adversarial Evaluation Genuineness Intelligence System) is an adversarial AI-driven assessment platform designed to address this emerging problem. The system explores how modern LLMs reason, fail, and can be manipulated through carefully engineered adversarial prompts. Its primary objective is to generate assessment questions that remain solvable by human candidates while deliberately exposing weaknesses in AI-generated responses.

The platform integrates adversarial machine learning principles with technical assessment workflows, enabling the creation, management, and evaluation of structured assessments across multiple question types, including coding challenges, system design problems, debugging tasks, and reasoning-based questions.

---

## User Characteristics

AEGIS is designed for two primary user types: Candidates (Users) and Recruiters (Admins). Each user interacts with the system in a distinct way based on their role within the assessment platform.

---

### 👤 Candidate (User)

The Candidate is the primary end-user of the system. This user interacts with AI-generated adversarial assessments.

**Characteristics:**
- Completes technical assessments
- Interacts with ambiguous and adversarial questions
- Requires a structured interface for answering questions

**System Usage:**
- Start and complete assessments
- Navigate between questions
- Answer fill-in-the-blank and scenario-based questions
- View timer during assessments
- Save and resume progress

---

### 🧑‍🏫 Recruiter (Admin)

The Admin is responsible for managing assessments.

**Characteristics:**
- Designs or selects assessment questions
- Assigns assessments to candidates
- Oversees system-generated adversarial content

**System Usage:**
- Create assessments
- Select questions from question bank
- Assign assessments to specific users

---

### 🤖 System (AEGIS Engine)

The system itself acts as an intelligent adversarial assessment generator.

**Characteristics:**
- Generates reasoning-heavy and adversarial questions
- Introduces ambiguity and edge-case scenarios
- Simulates AI failure conditions in assessments

**System Usage:**
- Inject adversarial reasoning patterns
- Maintain question bank consistency

## Use Cases

The system supports the following high-level use cases:

---

### Use Case 1: Create Assessment (Admin)
An administrator creates an assessment by selecting and assigning questions to a specific candidate.

### Use Case 2: Complete Assessment
A candidate completes a structured assessment consisting of adversarial questions. The assessment includes navigation, timing, and multiple question formats.

---

### Use Case 3: Save Assessment Progress
A candidate can save assessment progress. The system automatically persists responses to a database.

---
## Functional Requirements

The functional requirements are grouped into subsystems based on system architecture.

---

## Subsystem 1: Assessment Engine

FR1. The system shall allow a candidate to start an assessment.  
FR2. The system shall present questions from the predefined question bank.  
FR3. The system shall support multiple question types including:
- Fill-in-the-blank
- Multiple Choice Questions 

FR4. The system shall allow navigation between questions.  
FR5. The system shall display a timer during assessments.  

---

## Subsystem 2: Progress Management

FR6. The system shall automatically save assessment progress.  
FR7. The system shall persist user responses in a database.

---

## Subsystem 3: Assessment Management (Admin)

FR8. The system shall allow an administrator to create assessments.  
FR9. The system shall allow an administrator to select questions from a question bank.  
FR10. The system shall allow assignment of assessments to specific users.

---

## Subsystem 4: Adversarial Question Engine

FR12. The system shall generate ambiguous questions.  
FR13. The system shall incorporate adversarial AI failure patterns into question design.  
FR14. The system shall maintain a structured question bank for reuse.