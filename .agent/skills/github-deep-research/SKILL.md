---
name: "github-deep-research"
description: "Universal skill for performing a 3-Layer MCP Deep-Dive to extract architectures and best practices from Github repositories."
---

# SKILL: GitHub Deep-Research

## When to Use This Skill
You **MUST** use this skill when you encounter unknown technical constraints, need to implement a complex open-source library without internal patterns, or need to extract architectural/logic systems (like agent workflows) from an external GitHub repository.

## Core Rules: The 3-Layer Methodology
**NEVER** rely solely on the `README.md`. You must aggressively reverse-engineer the repository logic using the following 3 layers via `github-mcp-server`:

1. **Layer 1: Architecture Context** 
   - Read `README.md`, `ARCHITECTURE.md`, or the `docs/` folder to understand the high-level intent.
2. **Layer 2: Directory Scanning**
   - Use MCP tree/search/list tools to scan the repository structure.
   - Look specifically for core logic folders: `scripts/`, `.github/workflows/`, `src/core/`, `.agents/`, `prompts/`.
3. **Layer 3: Raw Source Extraction**
   - Use `get_file_contents` on the high-value files found in Layer 2.
   - Read the raw code, prompts, or configuration to reverse-engineer *how* the open-source solution actually works.

## Use Cases
- **Use Case 1 (Agent Cloning):** Extracting system prompts, XML execution loops, or behavior routines from AI repositories.
- **Use Case 2 (UI Engineering):** Reverse-engineering complex React/Next.js state management patterns from open-source component libraries (e.g., shadcn, opengnothia).
- **Use Case 3 (DB Architecture):** Discovering precise SQL/Prisma schema implementations in open-source SaaS platforms to solve scaling issues.

## Edge Cases & Anti-Patterns
- ❌ **Monorepos:** If the repository is a monorepo (e.g., contains a `packages/` or `apps/` directory), **DO NOT blind-scan**. You must locate the specific `packages/{target}` first and confine your deep-dive to that sub-directory.
- ❌ **Token Overflow:** If exploring massive codebases (e.g., React source, Next.js), you are forbidden from reading entire directories blindly. Mandate targeted `grep_search` or GitHub MCP Search for specific symbols, function names, or keywords to jump straight to the relevant file.
- ❌ **Compiled Code:** If you encounter `dist/`, `.min.js`, `.blob`, or binary files, **ABORT** that scan branch and look for the `/src` equivalent. Never reverse-engineer transpiled code.

## Execution Output
After successfully finishing the deep-dive:
1. Synthesize the extracted best practices.
2. Apply the exact logic, patterns, or architecture to the user's assignment.
3. Explicitly cite the file paths or URLs from the repository to validate your conclusions.
