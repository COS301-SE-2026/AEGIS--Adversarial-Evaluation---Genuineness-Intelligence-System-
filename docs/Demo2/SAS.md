# Software Architecture Specification (SAS)
---

## Table of Contents

### 1. Introduction
- AEGIS (Adversarial Evaluation and Genuineness Intelligence System) is a technical assessment platform built for BBD Software Development that aims to help recruiters detect candidates using AI tools during technical assessments. The platform takes a curated question bank of ordinary technical interview questions and enables the recuiter to generate adversarial variants of them, questions that look like standard coding or knowledge checks but are deliberately structured around known AI failure patterns, so that a candidate relying on an AI assistant is more likely to be caught out than a candidate answering genuinely. Beyond questions engineered to produce an incorrect AI answer, the platform is also being extended to recognise behavioural fingerprints characteristic of AI-generated responses regardless of correctness for example, a solution that reaches for unnecessary complexity a human wouldn't introduce for the stated problem or a user being able to complete a complex question in a short amount of time and with suspicious keystrokes. Each generated question passes through an automated validation step before it is used in a live assessment, confirming that it behaves as intended against an AI model before it ever reaches a real candidate.

### 2. Architectural Requirements
Contains the following:
- Architectural Patterns
- Design Patterns
- Architectural Constraints
- Architectural Diagram
- Quality Requirements Mapping
- [Architectural Requirements PDF]()


### 3. Technology Requirements
- [Technology Requirements PDF]()

### 4. API Contracts
- [API Contracts PDF]()

---
