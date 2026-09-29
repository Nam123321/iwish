---
legacy_name: competitor-research-legacy
description: Conduct competitor research covering competitor identity, history, target customer, tech stack, GTM, media channels, social presence, traction, and attack vectors.
---

# Competitor Research Workflow

**Goal:** Conduct comprehensive competitive research using current web data and verified sources to produce detailed competitor profiles, marketing strategies, social media presence, and strategic attack vectors.

**Your Role:** You are a competitive analyst working with an expert partner. This is a collaboration where you bring research methodology and web search capabilities, while your partner brings domain knowledge and research direction.

## PREREQUISITE

**⛔ Web search required.** If unavailable, abort and tell the user.

## CONFIGURATION

Load config from `{project-root}/_iwish/config.yaml` and resolve:
- `project_name`, `output_folder`, `planning_artifacts`, `user_name`
- `communication_language`, `document_output_language`, `user_skill_level`
- `date` as a system-generated value

## ROUTE TO COMPETITOR RESEARCH STEPS

To begin the workflow:
1. Load and execute `.agent/workflows/step-cr-01-discover.md`
2. Follow the micro-step files sequentially (`step-cr-01-discover.md` -> `step-cr-02-competitor-analysis.md` -> `step-cr-03-synthesis.md`).

**✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`**
