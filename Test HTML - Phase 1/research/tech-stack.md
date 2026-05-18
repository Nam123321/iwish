---
phase: "deep_dive"
title: "Technical Stack Research"
description: "Analysis of the technical stack for Career CRM."
refs: ["MASTER.md"]
---

# Technical Stack Research

**I want** to determine the optimal technologies to achieve local processing and native graph visualization.

## Technologies
- **Python (FastAPI)**: For lightweight local API routing.
- **Obsidian**: Local markdown editor with built-in graph visualization.
- **React + Tailwind**: Frontend UI.

PIVOT
Initially considered Next.js for the frontend, but pivoted to a simple static Vite build because we only need a lightweight local SPA without SSR.
