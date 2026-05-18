---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
inputDocuments: ["product_brief.md", "implementation_plan.md", "user_journeys.md"]
workflowType: 'prd'
phase: "origin"
title: "Product Requirements Document - AI Career CRM"
refs: ["MASTER.md"]
---

# Product Requirements Document - AI Career CRM & Knowledge Graph

**Author:** Trang
**Date:** 2026-04-14

## 1. Functional Requirements (FRs)

### FR-01: Job Tracking Kanban Module (Career-Ops Pipeline)
- The system MUST provide a drag-and-drop Kanban board via React.
- The board MUST track states: New, Tailoring, Applied, Interviewing, Offer, Rejected.
- Application state MUST be synced with a local flat-file (YAML/Markdown) system inherited directly from the `career-ops` repository structure, eliminating the need for relational databases like Supabase.

### FR-02: OSINT Scraper Engine
- The backend MUST schedule async scraping tasks at 08:00, 13:00, 18:00.
- The scraper MUST export raw HTML/Text into the Obsidian `raw/` directory.

### FR-03: Obsidian Knowledge Graph Auto-Ingestion
- The system MUST parse `raw/` data using LLM reasoning (Deepseek).
- The LLM MUST output structured Markdown files with YAML frontmatter and `[[wikilinks]]` for Entities (Company, Technology, Key Personnel).
- Files MUST be written to the `wiki/` directory to enable native Obsidian graph view.

### FR-04: AI Document Generation (CV Tailoring)
- The system MUST ingest the user's Master Profile and a target Job Description.
- The system MUST output a formatted `.docx` file using `python-docx`.
- The CV layout MUST dynamically adapt to the employer's branding guidelines (fonts, primary colors) via OSINT retrieval.

### FR-05: Smart Evaluation & Interview Prep
- The system MUST score parsed jobs (A to F rating) based on technical matching and OSINT red flags.
- The system MUST generate bespoke mock interview scenarios and strategic "reverse questions" leveraging the company's Obsidian knowledge nodes.

### FR-06: Instant OSINT Browser Extension (ZAP Injection)
- The system MUST provide a lightweight browser extension (Chrome/Edge).
- The extension MUST allow users to inject job URLs/content directly into the local FastAPI backend with one click, circumventing the manual scheduler.

### FR-07: Network Intelligence Map (Referral Charting)
- The Obsidian Vault MUST map key personnel (recruiters, alumni) identified via OSINT.
- The system MUST generate connection paths and strategic referral suggestions within the Knowledge Graph graph view.

### FR-08: Red-Flag Shield & Visual Kanban Alerts
- The tracking system MUST visually label toxic or high-risk JDs with clear "Red-Flag" warning colors on the Kanban board.
- The system MUST generate an explicit auto-warning summary blocking the user from applying silently if extreme red flags are detected.

### FR-09: Interactive Interview Chat Agent (Phase 1)
- The system MUST provide an interactive text-based chat interface.
- The chat agent MUST adopt specific recruiter personas (e.g., friendly HR, strict technical) to test the candidate with continuous case studies and situational questions mapped from the target employer's Knowledge Graph.

### FR-10: AI Job Discovery (Tinder-Swipe UX)
- The system MUST prioritize a "Tinder-style" AI job hunting experience for newly ingested OSINT jobs.
- The AI Evaluator will propose jobs one-by-one based on the user's Profile Anchor.
- **User Actions:** 
  - **Swipe Right (Like/Thích):** Automatically saves the job and pushes it into the "New" column of the Kanban board.
  - **Swipe Left/Skip (Bỏ qua):** Leaves the job in the pending pool to review later.

## FR-11: User Knowledge Graph & Psychological Assessment
- The system MUST construct a personalized Knowledge Graph for the user.
- **Static Baseline:** The system MUST allow the user to input a Seed Profile (Education, Career Path) and AI Alignment Keywords (Target Roles, Negative Keywords like "No Crypto", Industry preferences) to constrain and anchor the Job OSINT Scraper.
- **Dynamic Assessment (Behavioral & Cognitive):** The system MUST measure the user dynamically through Interactions (e.g., scoring Situational Judgment Tests - SJTs via the Interview Chatbot) and semantic analysis of their past projects using the OCEAN (Big Five) personality framework.
- The system MUST visually render a 5-point Psychological Radar Chart for the user and use this User Graph to calculate a "Match Score" against the Company Knowledge Graph traits.

### FR-12: Target Company Watchlist
- The system MUST maintain a distinct list of target employers ("Companies of Interest").
- The OSINT Scraper MUST be able to perform isolated priority scans on these companies to fetch immediate new openings or turnover flags.
- The Tinder-Swipe Evaluator (FR-10) MUST apply a positive ranking multiplier to jobs originating from the Watchlist, ensuring they appear first in the queue.

### FR-13: Application Vault & Artifact History
- The system MUST archive all user-generated artifacts indefinitely. This includes tailored `.docx` CVs, saved Raw JDs, application dates, and mock interview chat histories.
- The Vault MUST be searchable and filterable, allowing users to retrieve historical context of previous campaigns to improve their strategy.

### Non-Functional Requirements (NFRs)
- **NFR-01 (Architecture Pivot - Git-CMS):** Phase 1 Pilot Test sẽ sử dụng 100% tài nguyên GitHub. Frontend host trên Github Pages. Dữ liệu KB chung lưu tại Public Repo (Markdown files). Dữ liệu riêng tư Kanban lưu ở Private Gist hoặc IndexedDB.
- **NFR-02 (Automation):** Backend Python `scrapegraph-ai` chạy trên Github Actions, tự động fetch data, sinh `.md` file và tạo Pull Request vào Repo chính.
- **NFR-03 (Agentic Scouting Doctrine):** Nghiêm cấm code chay các framework UI lớn. Bắt buộc dùng `ghgrab` và `githubinspect.com` để scout Github, bê thẳng logic UI/CSS (Stitch-First) về xài. Code sinh ra phải khớp với `career-ops` yaml structure.

## 2. User Target & Personas
Hành trình người dùng (User Journeys) của hệ thống đóng vai trò định hình UX cốt lõi (như tính năng Tinder Swipe ở FR-10). Chi tiết về đặc điểm (Active/Passive candidates) và luồng trải nghiệm được mô tả chi tiết tại tài liệu chuyên trách:
👉 **[Xem chi tiết Chân dung & Hành trình Người dùng tại user_journeys.md](./user_journeys.md)**

## 3. Success Metrics
- **Efficiency Metric:** CV customization time reduced from 30+ minutes to < 2 minutes. Focus shifted entirely to interview preparation rather than document formatting.
- **Knowledge Retention:** Successful construction of a multi-node Graph spanning Employers, Recruiters, and Tech Stacks.

## 4. Backlog (Future Enhancements)
- **Interactive Interview Voice Agent (Phase 2):** Upgrade the text-based mock interview agent to support real-time audio conversations utilizing Web Speech APIs simulating verbal HR interviews.
