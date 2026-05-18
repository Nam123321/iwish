window.BMAD_NAV_DATA = {
  "origin": [
    {
      "id": "prd",
      "tag": "Node",
      "type": "node",
      "title": "Product Requirements Document - AI Career CRM",
      "description": "**Author:** Trang\n**Date:** 2026-04-14\n\n\n- The system MUST provide a drag-and-drop Kanban board via ...",
9:       "content": "# Product Requirements Document - AI Career CRM & Knowledge Graph\n\n**Author:** Trang\n**Date:** 2026-04-14\n\n## 1. Functional Requirements (FRs)\n\n### FR-01: Job Tracking Kanban Module (Career-Ops Pipeline)\n- **Priority: High**\n- **Admiralty: A1**\n- The system MUST provide a drag-and-drop Kanban board via React.\n- The board MUST track states: New, Tailoring, Applied, Interviewing, Offer, Rejected.\n- Application state MUST be synced with a local flat-file (YAML/Markdown) system inherited directly from the `career-ops` repository structure, eliminating the need for relational databases like Supabase.\n\n### FR-02: OSINT Scraper Engine\n- **Priority: High**\n- **Admiralty: A1**\n- The backend MUST schedule async scraping tasks at 08:00, 13:00, 18:00.\n- The scraper MUST export raw HTML/Text into the Obsidian `raw/` directory.\n\n### FR-03: Obsidian Knowledge Graph Auto-Ingestion\n- **Priority: High**\n- **Admiralty: B2**\n- The system MUST parse `raw/` data using LLM reasoning (Deepseek).\n- The LLM MUST output structured Markdown files with YAML frontmatter and `[[wikilinks]]` for Entities (Company, Technology, Key Personnel).\n- Files MUST be written to the `wiki/` directory to enable native Obsidian graph view.\n\n### FR-04: AI Document Generation (CV Tailoring)\n- **Priority: High**\n- **Admiralty: A1**\n1. Ingest Master Profile and target JD.\n2. Fetch employer branding (primary colors, font styles) from OSINT knowledge base.\n3. Generate formatted `.docx` using `python-docx` with dynamic style injection.\n\n### FR-05: Smart Evaluation & Interview Prep\n- **Priority: High**\n- **Admiralty: B2**\n1. Calculate Match Score (A-F) using technical OSINT mapping.\n2. Generate mock interview scenarios based on company-specific 'pain points' identified in Obsidian.\n3. Produce strategic 'reverse questions' for the user.\n\n### FR-06: Instant OSINT Browser Extension (ZAP Injection)\n- **Priority: Medium**\n- **Admiralty: A1**\n1. Capture active browser tab DOM/Content.\n2. Transmit payload to local FastAPI `/scout` endpoint.\n3. Trigger immediate Knowledge Graph ingestion and Gist update.\n\n### FR-07: Network Intelligence Map (Referral Charting)\n- **Priority: Medium**\n- **Admiralty: B3**\n- The Obsidian Vault MUST map key personnel (recruiters, alumni) identified via OSINT.\n- The system MUST generate connection paths and strategic referral suggestions within the Knowledge Graph graph view.\n\n### FR-08: Red-Flag Shield & Visual Kanban Alerts\n- **Priority: High**\n- **Admiralty: A1**\n1. Scan JD for high-risk keywords (toxic culture, high turnover, low glassdoor).\n2. Apply visual danger highlights to Kanban cards.\n3. Block application action if severity exceeds threshold without user override.\n\n### FR-09: Interactive Interview Chat Agent (Phase 1)\n- **Priority: Medium**\n- **Admiralty: C2**\n1. Select HR Persona (Friendly, Aggressive, Technical).\n2. Load context from Company Knowledge Graph.\n3. Conduct Situational Judgment Test (SJT) and score responses.\n\n### FR-10: AI Job Discovery (Tinder-Swipe UX)\n- **Priority: High**\n- **Admiralty: A2**\n1. Present jobs sequentially based on Profile Anchor.\n2. **Swipe Right:** Auto-save to Kanban 'New' column.\n3. **Swipe Left:** Log as 'Low Interest' and hide from main feed.\n\n## FR-11: User Knowledge Graph & Psychological Assessment\n- **Priority: High**\n- **Admiralty: A1**\n- The system MUST construct a personalized Knowledge Graph for the user.\n- **Static Baseline:** Input Seed Profile and AI Alignment Keywords.\n- **Dynamic Assessment:** Measure behavioral traits via OCEAN framework analysis of project descriptions.\n\n### FR-12: Target Company Watchlist\n- **Priority: Low**\n- **Admiralty: B2**\n- The system MUST maintain a distinct list of target employers (\"Companies of Interest\").\n- The OSINT Scraper MUST be able to perform isolated priority scans on these companies to fetch immediate new openings or turnover flags.\n\n### FR-13: Application Vault & Artifact History\n- **Priority: Medium**\n- **Admiralty: A1**\n- The system MUST archive all user-generated artifacts indefinitely (CVs, JDs, Chat histories).\n- The Vault MUST be searchable and filterable for historical strategy analysis.\n\n### Non-Functional Requirements (NFRs)\n- **NFR-01 (Architecture Pivot - Git-CMS):** Phase 1 Pilot Test sẽ sử dụng 100% tài nguyên GitHub. Frontend host trên Github Pages. Dữ liệu KB chung lưu tại Public Repo (Markdown files). Dữ liệu riêng tư Kanban lưu ở Private Gist hoặc IndexedDB.\n- **NFR-02 (Automation):** Backend Python `scrapegraph-ai` chạy trên Github Actions, tự động fetch data, sinh `.md` file và tạo Pull Request vào Repo chính.\n- **NFR-03 (Agentic Scouting Doctrine):** Nghiêm cấm code chay các framework UI lớn. Bắt buộc dùng `ghgrab` và `githubinspect.com` để scout Github, bê thẳng logic UI/CSS (Stitch-First) về xài. Code sinh ra phải khớp with `career-ops` yaml structure.\n\n## 2. User Target & Personas\nHành trình người dùng (User Journeys) của hệ thống đóng vai trò định hình UX cốt lõi (như tính năng Tinder Swipe ở FR-10). Chi tiết về đặc điểm (Active/Passive candidates) và luồng trải nghiệm được mô tả chi tiết tại tài liệu chuyên trách:\n👉 **[Xem chi tiết Chân dung & Hành trình Người dùng tại user_journeys.md](./user_journeys.md)**\n\n## 3. Success Metrics\n- **Efficiency Metric:** CV customization time reduced from 30+ minutes to < 2 minutes. Focus shifted entirely to interview preparation rather than document formatting.\n- **Knowledge Retention:** Successful construction of a multi-node Graph spanning Employers, Recruiters, and Tech Stacks.\n\n## 4. Backlog (Future Enhancements)\n- **Interactive Interview Voice Agent (Phase 2):** Upgrade the text-based mock interview agent to support real-time audio conversations utilizing Web Speech APIs simulating verbal HR interviews.",pgrade the text-based mock interview agent to support real-time audio conversations utilizing Web Speech APIs simulating verbal HR interviews.",
      "footerLeft": "Status: Planning",
      "footerRight": "#node",
      "resolved_refs": [
        "MASTER.md",
        "user_journeys"
      ],
      "hasPivot": false,
      "pivots": []
    },
    {
      "id": "user_journeys",
      "tag": "Node",
      "type": "node",
      "title": "User Personas & Journeys",
      "description": "Detailed analysis of target users and their psychological interaction loops.",
      "content": "# User Personas & Journeys\n\n## 1. Persona: Alex (The Passive Seeker)\n- **Profile:** Senior DevOps, stable but curious.\n- **Need:** Low-friction discovery, absolute privacy.\n- **Journey:** Uses **FR-10** (Tinder-Swipe) during morning coffee to filter high-signal jobs without manual searching.\n\n## 2. Persona: Jordan (The Active Pivot)\n- **Profile:** Junior Analyst transitioning to AI Engineering.\n- **Need:** Heavy interview prep, high-quality CV tailoring.\n- **Journey:** Relies on **FR-04** (CV Tailoring) and **FR-09** (Interview Chat) to bridge the skill gap.\n\n## 3. The 'Tinder-Swipe' Feedback Loop\nThis UX pattern (defined in **FR-10**) is designed to reduce decision fatigue. By presenting one job at a time based on the **FR-11** (User Knowledge Graph), we maximize focus and prevent the 'infinite scroll' exhaustion common on LinkedIn.",
      "footerLeft": "Status: Drafted",
      "footerRight": "#ideation",
      "resolved_refs": [
        "prd.md"
      ],
      "hasPivot": false,
      "pivots": []
    },
    {
      "id": "MASTER",
      "tag": "Node",
      "type": "node",
      "title": "Webstore / Career-Ops Design System (MASTER)",
      "description": "Master design system and architectural constraints.",
      "content": "# Webstore / Career-Ops Design System (MASTER)\n\n## 🎨 Theme: \"Warm Earth Tones\" & \"Liquid Glass\"\n\n### 1. Typography\n- **Primary Font:** Inter or Roboto (Modern sleek sans-serif).\n- **Secondary/Display Font:** Playfair Display (For headings and document styling like CV generation anchor).\n\n### 2. Color Palette (Tailwind Safelist Enforced)\n- **Primary/Action:** `text-amber-700`, `bg-amber-100` (Warm earthy orange/brown indicating progress/neutral-action)\n- **Success/Safe:** `text-emerald-700`, `bg-emerald-100` (For High Admiralty Match Scores)\n- **Danger/Red-Flag:** `text-red-600`, `bg-red-50/20` (For toxic Job Description elements)\n- **Surfaces:** Soft Neutrals (`gray-50` to `gray-900`)\n\n### 3. Materials & Effects (Liquid Glass)\n- Focus on extensive use of `backdrop-blur-md` and semi-transparent backgrounds like `bg-white/40` and `bg-white/60` to create a feeling of premium depth and glass UI over varied backgrounds.\n- High-fidelity soft shadows: `shadow-xl shadow-amber-900/5`\n\n### 4. Core Component Libraries\n- **Base Components:** Shadcn/UI (Radix primitives)\n- **Animations & Gestures:** Framer Motion (Swipe panels, Modals, State Transitions)\n- **Icons:** Lucide React\n\n### 5. Architectural UI Contracts\n- The system MUST be built as a strictly frontend SPA with a static build out directory (Vite).\n- All visual alerts representing LLM decisions (e.g., Red-Flags) MUST use the exact defined Tailwind tokens.\n- Keep components composable to support easy modification and responsive 60/40 Split Views and mobile Bottom Sheets.",
      "footerLeft": "Status: Planning",
      "footerRight": "#node",
      "resolved_refs": [],
      "hasPivot": false,
      "pivots": []
    },
    {
      "id": "EPIC-01",
      "tag": "Node",
      "type": "epic",
      "title": "Core Infrastructure",
      "description": "Establish the foundational infrastructure for the CRM.",
      "content": "# EPIC-01: Core Infrastructure\n\n**I want** to build a scalable base infrastructure for the AI Career CRM so that we can support all downstream features like OSINT scraping and document generation.\n\n## Acceptance Criteria\n1. FastAPI backend is initialized (Supports **FR-02**, **FR-06**).\n2. Obsidian vault folder structure is mapped (Supports **FR-03**, **FR-07**).\n3. Automated GitHub Actions for daily scraping are drafted.\n\nPIVOT\nInitially, we planned to use Supabase, but we pivoted to a local markdown flat-file system (`wiki/`) to integrate directly with Obsidian for graph viewing and data ownership. This directly enables **FR-13** (Application Vault).",
      "footerLeft": "Status: In Progress",
      "footerRight": "Platform Team",
      "resolved_refs": [
        "prd.md",
        "research/tech-stack.md"
      ],
      "hasPivot": true,
      "pivots": [
        "PIVOT\nInitially, we planned to use Supabase, but we pivoted to a local markdown flat-file system (`wiki/`) to integrate directly with Obsidian for graph viewing and data ownership."
      ]
    }
  ],
  "spark": [],
  "deep_dive": [
    {
      "id": "bmad_research_report",
      "tag": "Node",
      "type": "node",
      "title": "bmad_research_report.md",
      "description": "**Date:** 2026-04-14\n**Author:** Master-Roshi (AI Facilitator)\n**Research Type:** Comprehensive (Mar...",
      "content": "# Research Report: Comprehensive Multi-Dimensional Analysis\n\n**Date:** 2026-04-14\n**Author:** Master-Roshi (AI Facilitator)\n**Research Type:** Comprehensive (Market, Domain, Technical)\n\n---\n\n## 1. Market Research: AI Job Seeker CRMs & Platforms\n\nThe landscape for Job Seeker CRMs is rapidly evolving from basic spreadsheet replacements to fully AI-augmented virtual coaches.\n\n### Key Competitors & Patterns\n1. **Teal:** The market leader in AI Resume Building and tracking. It acts as an \"operating system\" for job seekers. Its primary hook is the **Job Match Score** (rating a resume against an ATS parser) and a Chrome extension to save jobs.\n2. **Huntr:** The visual pioneer. It uses a Kanban board as its core UI to clip jobs from anywhere and track applications. It recently integrated AI tools for tailoring.\n3. **Prentus:** Focuses heavily on the interview phase, pairing job tracking with AI mock interviews.\n4. **AIApply / Simplify:** Focuses on the \"Auto-Apply\" and form-filling automation aspect, aiming to maximize application volume.\n\n**Our Unfair Advantage (The \"White Space\"):** \nMost existing tools are cloud-based SaaS products that lock user data behind subscriptions. None of them utilize an **Obsidian-backed Local Knowledge Graph** to map recruiters and company history. Our product merges the Kanban style of Huntr (**FR-01**), the ATS parsing of Teal (**FR-04**), and the deep Network Intelligence of a private OSINT agency (**FR-07**).\n\n---\n\n## 2. Technical Research: AI OSINT & Autonomous Web Scraping\n\nTo populate the Obsidian Second Brain automatically, we need modern Agentic Web Scraping tools that bypass the brittleness of traditional DOM-based scrapers (like simple BeautifulSoup).\n\n### Leading Solutions & Architecture\n1. **ScrapeGraphAI (Python):** The most promising open-source solution for our FastAPI backend. It utilizes LLMs to generate scraping pipelines dynamically. If a site changes its layout, the LLM self-heals the selector, ensuring extreme reliability. This technology is the backbone of **FR-02** (OSINT Scraper).\n2. **Bright Data / Forage AI:** Enterprise-grade extraction agents. Overkill for a local CRM, but their architecture (Agentic loops: think, act, observe) is the gold standard.\n3. **Browserbase / Vercel Agent:** Headless browser automation that LLMs can drive.\n\n**Implementation Recommendation:** \nAdopt **ScrapeGraphAI** in the FastAPI backend for the scheduled 8am/1pm/6pm runs. For the \"ZAP Injection\" Chrome Extension (**FR-06**), simply pass the raw HTML text to a local FastAPI endpoint which then uses a local/API LLM to parse entities (Company, JD, Salary) and write directly to Obsidian Markdown (**FR-03**).\n\n---\n\n## 3. Domain Research: Evaluating Data Reliability & Scoring\n\nSince the system will scrape job descriptions and company news from the wild (LinkedIn, public reviews), evaluating the *credibility* of that data is paramount for the **Red-Flag Shield** (**FR-08**).\n\n### The OSINT Admiralty Code (ICD 203 Standard)\nThe intelligence community uses a standard matrix to score data, which we can programmatically adapt:\n*   **Source Reliability (A-F):** Is the origin credible? (e.g., A = Official Company Site, C = Third-party Job Board, F = Unverified Reddit comment).\n*   **Information Credibility (1-6):** Is the data corroborated? (e.g., 1 = Confirmed by multiple sources, 3 = Plausible, 6 = Cannot be judged).\n\n### Application to the Kanban Red-Flag Shield\n- **Scoring Algorithm:** The backend LLM will assign an Admiralty Score (e.g., \"A1\" or \"C4\") to parsed job info. \n- **Red Flags:** Information flagged as \"Toxic Culture\" sourced from a \"C\" (Fairly Reliable - Glassdoor) with a Credibility of \"1\" (Confirmed by many reviews) will trigger an absolute **RED FLAG** on the Kanban board, physically warning the user (supports **FR-08** and **FR-05** scoring logic).\n\n---\n\n## Conclusion\nThe combination of local, self-healing **ScrapeGraphAI**, the visual tracking of a **Huntr-style Kanban**, and rigorous **Admiralty Code data scoring** places this architecture far ahead of standard consumer tools. The project is fully validated technically and market-wise.",
      "footerLeft": "Status: Planning",
      "footerRight": "#node",
      "resolved_refs": [],
      "hasPivot": false,
      "pivots": []
    },
    {
      "id": "tech-stack",
      "tag": "Node",
      "type": "node",
      "title": "Technical Stack Research",
      "description": "Analysis of the technical stack for Career CRM.",
      "content": "# Technical Stack Research\n\n**I want** to determine the optimal technologies to achieve local processing and native graph visualization.\n\n## Technologies\n- **Python (FastAPI)**: For lightweight local API routing. (Essential for **FR-02** and **FR-09**).\n- **Obsidian**: Local markdown editor with built-in graph visualization. (Core of **FR-03** and **FR-07**).\n- **React + Tailwind**: Frontend UI.\n\nPIVOT\nInitially considered Next.js for the frontend, but pivoted to a simple static Vite build because we only need a lightweight local SPA without SSR.",
      "footerLeft": "Status: Planning",
      "footerRight": "#node",
      "resolved_refs": [
        "MASTER.md"
      ],
      "hasPivot": true,
      "pivots": [
        "PIVOT\nInitially considered Next.js for the frontend, but pivoted to a simple static Vite build because we only need a lightweight local SPA without SSR."
      ]
    }
  ],
  "forge": [
    {
      "id": "product_brief",
      "tag": "Node",
      "type": "node",
      "title": "Product Brief: AI Career CRM & Knowledge Graph",
      "description": "<!-- Content will be appended sequentially through collaborative workflow steps -->\n\nThe current job...",
      "content": "# Product Brief: AI Career CRM & Knowledge Graph\n\n<!-- Content will be appended sequentially through collaborative workflow steps -->\n\n## 1. Product Vision & Problem Statement\nThe current job-hunting process is scattered and highly manual. Candidates manually search for jobs, tailor their CVs poorly due to time constraints, and lack contextual intelligence about the employers they interview with. \n**Vision:** An autonomous, localhost AI Career Assistant that centralizes job tracking, automates CV tailoring with employer branding, and builds a \"Second Brain\" knowledge graph of the tech market to give candidates absolute leverage in interviews.\n\n## 2. Target Users & Personas\n- **The Modern Job Seeker (Developer/Tech Worker):** Wants local data ownership, AI empowerment for customizing resumes at scale, and comprehensive Open-Source Intelligence (OSINT) on companies to win interviews. (See **user_journeys** for deep-dive personas).\n\n## 3. Core Experience & Flows\n- **Discovery Flow (Scheduled & Instant):** OSINT scrapers run daily in the background. Alternatively, users can instantly inject new JDs directly from LinkedIn/Indeed via a lightweight \"ZAP\" Chrome Extension without waiting (**FR-06**). This flow populates the **AI Discovery Module (FR-10)**.\n- **Action Flow & Red-Flag Shield:** User reviews a Kanban board (**FR-01**). The system visually blocks/warns (via Red-Flag shield) if toxic patterns are detected in the JDs (**FR-08**). If safe, the user hits \"Auto-Tailor CV\".\n- **Generation Flow:** AI references the user's master profile and the company's knowledge graph (**FR-11**) to output a personalized `.docx` CV (**FR-04**).\n- **Network Intelligence Flow:** The Obsidian Knowledge Graph surfaces structural connections (alumni, recruiters) to suggest strategic referral paths for the target job (**FR-07**).\n- **Preparation Flow:** Before the interview, the AI generates Mock Interviews and Reverse Interview questions based on the accumulated Obsidian Knowledge Graph (**FR-05**). Through a real-time text-based chat interface (**FR-09**), users can practice answering case studies and tricky scenario questions against customizable HR personas.\n\n## 4. Constraints & Boundaries\n- Must run locally (localhost) for privacy and zero-cost hosting (**NFR-01**).\n- Must export Word (`.docx`) CVs (highest priority formatting requested by user).\n- Knowledge Database must be entirely Markdown-driven (`[[wikilinks]]`) via Obsidian to ensure long-term data portability and native graph visualization (**FR-03**).",
      "footerLeft": "Status: Planning",
      "footerRight": "#node",
      "resolved_refs": [
        "prd.md",
        "MASTER.md"
      ],
      "hasPivot": false,
      "pivots": []
    },
    {
      "id": "STORY-01",
      "tag": "STORY-01",
      "type": "story",
      "title": "Set up Obsidian Integration",
      "description": "Configure local paths to read/write from Obsidian.",
      "content": "# STORY-01: Set up Obsidian Integration\n\n**I want** to read and write directly to an Obsidian vault so that AI-generated intelligence automatically populates my personal knowledge graph.\n\n## Acceptance Criteria\n- [x] Python script can read `.md` files (Supports **FR-03**).\n- [x] WikiLinks are preserved in output files (Supports **FR-07**).\n- [x] YAML frontmatter is generated correctly for entity mapping (**FR-11**).",
      "footerLeft": "Status: Completed",
      "footerRight": "Platform Team",
      "resolved_refs": [
        "epics/epic-01.md"
      ],
      "hasPivot": false,
      "pivots": []
    }
  ],
  "edges": [
    { "source": "user_journeys", "target": "prd", "type": "depends_on" },
    { "source": "bmad_research_report", "target": "product_brief", "type": "depends_on" },
    { "source": "product_brief", "target": "prd", "type": "depends_on" },
    { "source": "prd", "target": "MASTER", "type": "related_to" },
    { "source": "prd", "target": "EPIC-01", "type": "depends_on" },
    { "source": "EPIC-01", "target": "STORY-01", "type": "depends_on" }
  ]
};
