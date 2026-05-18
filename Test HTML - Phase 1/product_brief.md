---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: ["implementation_plan.md"]
date: 2026-04-14
author: Trang
phase: "forge"
title: "Product Brief: AI Career CRM & Knowledge Graph"
refs: ["prd.md", "MASTER.md"]
---

# Product Brief: AI Career CRM & Knowledge Graph

<!-- Content will be appended sequentially through collaborative workflow steps -->

## 1. Product Vision & Problem Statement
The current job-hunting process is scattered and highly manual. Candidates manually search for jobs, tailor their CVs poorly due to time constraints, and lack contextual intelligence about the employers they interview with. 
**Vision:** An autonomous, localhost AI Career Assistant that centralizes job tracking, automates CV tailoring with employer branding, and builds a "Second Brain" knowledge graph of the tech market to give candidates absolute leverage in interviews.

## 2. Target Users & Personas
- **The Modern Job Seeker (Developer/Tech Worker):** Wants local data ownership, AI empowerment for customizing resumes at scale, and comprehensive Open-Source Intelligence (OSINT) on companies to win interviews.

## 3. Core Experience & Flows
- **Discovery Flow (Scheduled & Instant):** OSINT scrapers run daily in the background. Alternatively, users can instantly inject new JDs directly from LinkedIn/Indeed via a lightweight "ZAP" Chrome Extension without waiting.
- **Action Flow & Red-Flag Shield:** User reviews a Kanban board. The system visually blocks/warns (via Red-Flag shield) if toxic patterns are detected in the JDs. If safe, the user hits "Auto-Tailor CV".
- **Generation Flow:** AI references the user's master profile and the company's knowledge graph to output a personalized `.docx` CV.
- **Network Intelligence Flow:** The Obsidian Knowledge Graph surfaces structural connections (alumni, recruiters) to suggest strategic referral paths for the target job.
- **Preparation Flow:** Before the interview, the AI generates Mock Interviews and Reverse Interview questions based on the accumulated Obsidian Knowledge Graph. Through a real-time text-based chat interface, users can practice answering case studies and tricky scenario questions against customizable HR personas.

## 4. Constraints & Boundaries
- Must run locally (localhost) for privacy and zero-cost hosting.
- Must export Word (`.docx`) CVs (highest priority formatting requested by user).
- Knowledge Database must be entirely Markdown-driven (`[[wikilinks]]`) via Obsidian to ensure long-term data portability and native graph visualization.
