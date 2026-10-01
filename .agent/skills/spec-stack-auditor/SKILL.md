---
name: spec-stack-auditor
description: LLM-based semantic scanner for Markdown documents (Epic, PRD) to validate conceptual architecture against actual tech stack choices.
---

# 🕵️ Specification Tech Stack Auditor

## 1. Concept & Purpose
The **Specification Tech Stack Auditor** is an agentic semantic validation skill. It scans Markdown specification documents (like PRD, Epic, and Story files) and cross-references them against the chosen Technical Architecture and Tech Stack configurations.

Its primary goal is to **detect conceptual architectural misalignment**:
- Are the functional and non-functional requirements (NFRs) feasible with the current stack?
- Are there contradictions? (e.g., specifying high-frequency real-time updates but omitting a WebSocket/streaming layer).
- Are we reinventing the wheel when an existing library in the stack covers the requirement?

## 2. Trigger Conditions
This skill should be invoked natively during the **Planning** and **Architecture** phases, specifically:
- When reviewing a newly generated Epic or PRD.
- When selecting or upgrading the Technical Architecture.
- When structural drift is suspected between business needs and technical capabilities.

## 3. The Audit Protocol (3-Pass Scan)

When executing this skill, the agent MUST perform the following 3-Pass Scan:

### Pass 1: Extraction (The "What")
1. Read the provided specification documents (e.g., `prd.md`, `epic.md`).
2. Extract all **Functional Requirements (FRs)** that imply a specific technical capability (e.g., "Export to PDF", "Search with typo tolerance", "Role-based access control").
3. Extract all **Non-Functional Requirements (NFRs)** (e.g., "Sub-100ms latency", "Offline support").

### Pass 2: Mapping (The "How")
1. Read the project's technical context (e.g., `project-context.md`, Architecture diagrams, package.json, or tech stack manifest).
2. Map each extracted FR and NFR to the specific component/library in the tech stack intended to fulfill it.

### Pass 3: Gap Analysis & Feasibility Check
Evaluate the mapping for the following anti-patterns:
- **Unmet Requirements (Gaps):** An FR/NFR exists but no technology in the stack can support it without significant custom engineering.
- **Over-engineering:** The tech stack includes heavy dependencies for a trivial requirement.
- **Conceptual Misalignment:** The chosen technology is fundamentally hostile to the requirement (e.g., using a pure Relational DB for deep graph traversal queries, or using standard HTTP polling for high-frequency trading data).

## 4. Execution Output Format
The agent MUST output a `Spec-Stack Audit Report` in the following structure:

```markdown
# Spec-Stack Audit Report: [Document Name]

## 1. Stack Alignment Score (0-100%)
*Provide a holistic confidence score.*

## 2. Identified Misalignments (The Gaps)
| Requirement ID/Name | Expected Technical Capability | Current Stack Capability | Risk Level |
|---------------------|-------------------------------|--------------------------|------------|
| NFR-03 (Offline)    | Local-first DB sync           | Standard REST API only   | CRITICAL   |

## 3. Recommendations
*Propose specific stack additions, architecture changes, or requirement renegotiations to resolve the gaps.*
```

## 5. Enforcement Gate
If any **CRITICAL** risk level misalignments are found, the agent MUST flag this as a blocking issue (Outputting `STATUS: BLOCKED`) and request user intervention before the Epic/Story can proceed to the development phase.
