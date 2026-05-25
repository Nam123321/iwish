# UI/UX Pro Max Specialist Integration — Trimmed Retrieval Dataset Plan

## Purpose

This document defines the specific subset of the original UI/UX Pro Max repository that BMAD will ingest. 

As established in the `retrieval-sandwich-architecture.md`, we are importing this dataset to serve exclusively as an **evidence layer**. The goal is to maximize the retrieval of reusable UX patterns and interaction-system scaffolding while minimizing brand-override risk and context bloat.

## 1. High-Value Retrieval Targets (Inclusion Criteria)

We will selectively ingest files and directories that provide structural UX intelligence without enforcing rigid visual branding.

### 1.1 UX Patterns & Interaction Modules
- **Target:** Directories containing generic UX pattern definitions (e.g., `patterns/`, `modules/`, `interaction-systems/`).
- **Why:** To improve BMAD's ability to recommend structurally sound flows for complex tasks (e.g., multi-step wizards, data-heavy tables, empty states).

### 1.2 Master Component Scaffolding
- **Target:** High-level component specifications that define states (hover, active, disabled) and structural composition, excluding hardcoded color hexes.
- **Why:** To accelerate the generation of `MASTER.md` component definitions by providing a broader first-pass structural checklist.

### 1.3 Best Practice Checklists & Heuristics
- **Target:** Documentation covering accessibility (a11y) standards, responsive layout breakpoints, and cognitive load heuristics.
- **Why:** To provide the retrieval-sandwich with strong, domain-agnostic rules for evaluating candidate archetypes.

## 2. Low-Value / High-Risk Targets (Exclusion Criteria)

To preserve BMAD's brand-fit and product-fit governance (NFR1), the following elements of the original repo **must be explicitly excluded**:

### 2.1 Rigid Design Tokens & Palettes
- **Exclude:** Files defining specific color palettes, exact hex codes, or rigid typography family assignments (e.g., `tokens.css`, `colors.json`, `fonts.md`).
- **Why:** These directly conflict with the "Brand Truth" extraction stage and bypass the BMAD absorb's brand-fit safety constraints.

### 2.2 Highly Specific Product Implementations
- **Exclude:** Case studies or template files built for hyper-specific brands (e.g., gaming startup themes) that do not generalize.
- **Why:** They skew the retrieval synthesis toward off-product archetypes, increasing the likelihood of Stage 4 (Archetype Rejection) failures.

### 2.3 Executable Build Scripts & Tooling
- **Exclude:** The original repo's automated generation scripts (e.g., its native `--design-system` CLI generators).
- **Why:** BMAD uses its own governed workflow engine. External scripts bypass the required retrieval-sandwich sequence.

## 3. Ingestion Strategy

### 3.1 Import Mechanism
We will use a **Targeted Partial Repomix** strategy:
1. Fetch the external repository into a temporary sandbox.
2. Run a strict inclusion/exclusion filter script (based on the criteria above).
3. Extract the surviving Markdown and structural JSON files.
4. Flatten the extracted content into a single or chunked knowledge base artifact optimized for LLM retrieval.

### 3.2 Storage Location
The trimmed dataset will be stored in an isolated directory within BMAD's knowledge architecture:
- **Path:** `_bmad/knowledge/uiux-pro-max-evidence/`
- **Constraint:** Files placed here must be clearly marked via a prefix or metadata tag as `EVIDENCE_ONLY` to prevent them from being mistaken for governed source-of-truth instructions.

## 4. Alignment with Retrieval-Sandwich Architecture

This plan strictly aligns with the previously defined architecture:
- **Evidence-Only Rule:** By storing the dataset in a dedicated `evidence` directory and stripping out rigid design tokens, we ensure this data acts as a supporting signal rather than an authoritative override.
- **NFR1 Compliance:** By explicitly dropping tokens, build scripts, and hyper-specific templates, we prevent importing the entire external repo, keeping the dataset trimmed and focused.
- **Retrieval Enhancement:** The focused ingestion of UX patterns directly feeds Stage 3 (Original-Repo Retrieval), improving the breadth of candidates without poisoning Stage 1 (Brand Truth).
