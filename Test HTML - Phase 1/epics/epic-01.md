---
phase: "origin"
epic_id: "EPIC-01"
title: "Core Infrastructure"
description: "Establish the foundational infrastructure for the CRM."
status: "In Progress"
assignee: "Platform Team"
refs: ["prd.md", "tech-stack.md"]
---

# EPIC-01: Core Infrastructure

**I want** to build a scalable base infrastructure for the AI Career CRM so that we can support all downstream features like OSINT scraping and document generation.

## Acceptance Criteria
1. FastAPI backend is initialized.
2. Obsidian vault folder structure is mapped.
3. Automated GitHub Actions for daily scraping are drafted.

PIVOT
Initially, we planned to use Supabase, but we pivoted to a local markdown flat-file system (`wiki/`) to integrate directly with Obsidian for graph viewing and data ownership.
