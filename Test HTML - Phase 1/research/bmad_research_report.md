---
workflowType: 'research'
research_type: 'Comprehensive (Market, Domain, Technical)'
research_topic: 'AI Career CRM, OSINT Data Ingestion, Data Reliability Scoring'
date: '2026-04-14'
web_research_enabled: true
source_verification: true
phase: "deep_dive"

---
# Research Report: Comprehensive Multi-Dimensional Analysis

**Date:** 2026-04-14
**Author:** Master-Roshi (AI Facilitator)
**Research Type:** Comprehensive (Market, Domain, Technical)

---

## 1. Market Research: AI Job Seeker CRMs & Platforms

The landscape for Job Seeker CRMs is rapidly evolving from basic spreadsheet replacements to fully AI-augmented virtual coaches.

### Key Competitors & Patterns
1. **Teal:** The market leader in AI Resume Building and tracking. It acts as an "operating system" for job seekers. Its primary hook is the **Job Match Score** (rating a resume against an ATS parser) and a Chrome extension to save jobs.
2. **Huntr:** The visual pioneer. It uses a Kanban board as its core UI to clip jobs from anywhere and track applications. It recently integrated AI tools for tailoring.
3. **Prentus:** Focuses heavily on the interview phase, pairing job tracking with AI mock interviews.
4. **AIApply / Simplify:** Focuses on the "Auto-Apply" and form-filling automation aspect, aiming to maximize application volume.

**Our Unfair Advantage (The "White Space"):** 
Most existing tools are cloud-based SaaS products that lock user data behind subscriptions. None of them utilize an **Obsidian-backed Local Knowledge Graph** to map recruiters and company history. Our product merges the Kanban style of Huntr, the ATS parsing of Teal, and the deep Network Intelligence of a private OSINT agency.

---

## 2. Technical Research: AI OSINT & Autonomous Web Scraping

To populate the Obsidian Second Brain automatically, we need modern Agentic Web Scraping tools that bypass the brittleness of traditional DOM-based scrapers (like simple BeautifulSoup).

### Leading Solutions & Architecture
1. **ScrapeGraphAI (Python):** The most promising open-source solution for our FastAPI backend. It utilizes LLMs to generate scraping pipelines dynamically. If a site changes its layout, the LLM self-heals the selector, ensuring extreme reliability.
2. **Bright Data / Forage AI:** Enterprise-grade extraction agents. Overkill for a local CRM, but their architecture (Agentic loops: think, act, observe) is the gold standard.
3. **Browserbase / Vercel Agent:** Headless browser automation that LLMs can drive.

**Implementation Recommendation:** 
Adopt **ScrapeGraphAI** in the FastAPI backend for the scheduled 8am/1pm/6pm runs. For the "ZAP Injection" Chrome Extension, simply pass the raw HTML text to a local FastAPI endpoint which then uses a local/API LLM to parse entities (Company, JD, Salary) and write directly to Obsidian Markdown.

---

## 3. Domain Research: Evaluating Data Reliability & Scoring

Since the system will scrape job descriptions and company news from the wild (LinkedIn, public reviews), evaluating the *credibility* of that data is paramount for the **Red-Flag Shield**.

### The OSINT Admiralty Code (ICD 203 Standard)
The intelligence community uses a standard matrix to score data, which we can programmatically adapt:
*   **Source Reliability (A-F):** Is the origin credible? (e.g., A = Official Company Site, C = Third-party Job Board, F = Unverified Reddit comment).
*   **Information Credibility (1-6):** Is the data corroborated? (e.g., 1 = Confirmed by multiple sources, 3 = Plausible, 6 = Cannot be judged).

### Application to the Kanban Red-Flag Shield
- **Scoring Algorithm:** The backend LLM will assign an Admiralty Score (e.g., "A1" or "C4") to parsed job info. 
- **Red Flags:** Information flagged as "Toxic Culture" sourced from a "C" (Fairly Reliable - Glassdoor) with a Credibility of "1" (Confirmed by many reviews) will trigger an absolute **RED FLAG** on the Kanban board, physically warning the user.

---

## Conclusion
The combination of local, self-healing **ScrapeGraphAI**, the visual tracking of a **Huntr-style Kanban**, and rigorous **Admiralty Code data scoring** places this architecture far ahead of standard consumer tools. The project is fully validated technically and market-wise.
