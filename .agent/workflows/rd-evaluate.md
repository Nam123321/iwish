---
name: rd-evaluate
description: Standardized R&D pipeline for evaluating internal tech stack libraries and external user-facing plugins. Features dual-intake and simulated edge-case discovery.
---

# Cowok.ai R&D Evaluation Workflow (`/rd-evaluate`) v2

This workflow governs the evaluation and documentation of new technologies for the Cowok.ai project. It enforces the `docs/R&D-Library/templates/rd-template.md` standard.

**Estimated Time:** ~30-45 minutes per R&D evaluation.

---

## Step 1: Intake & Classification (Dual-Intake)

Analyze the user's prompt to determine the intake path.

- **IF Use Case 1 (Problem-Driven):** The user provides a goal (e.g., "Find an OCR tool").
  1. Trigger the `/research-solution-sources` workflow to discover and score candidates from GitHub/Internet.
  2. Await the recommendation from `/research-solution-sources`.
  3. Set the recommended tool as the target and proceed to Step 2.

- **IF Use Case 2 (Target-Driven):** The user provides a specific tool (e.g., "Evaluate Crawl4AI").
  1. Set the provided tool as the target.
  2. Proceed to Step 2.

- **Track Pre-Classification:** Make an initial guess: `INTERNAL` / `PLUGIN` / `UNKNOWN`. This will be finalized in Step 9.

- **Complexity Scoring & Express Mode Check:** 
  Calculate the Complexity Score (CS) based on:
  - Size: Is the repo small/utility-focused? (1 pt)
  - Dependencies: No native C/C++ builds required? (1 pt)
  - Scope: UI component or single-purpose logic? (1 pt)
  - System Impact: Does not modify OS/Infrastructure? (1 pt)
  If CS >= 3, **PROMPT USER**: *"Công cụ này có vẻ là một tiện ích nhỏ gọn. Bạn có muốn chạy chế độ `--express` để tiết kiệm thời gian (bỏ qua Sandbox test và 5-Lens mô phỏng sâu) không?"*
  - Nếu User đồng ý: Chuyển luồng sang `rd-evaluate-express` skill và kết thúc luồng này.
  - Nếu User từ chối: Tiếp tục workflow thông thường.

---

## Step 2: Clone & Security Scan

Clone the repository and run a 4-layer security analysis (adapted from `/absorb-repo` Phase 0).

1. `git clone --depth=1 {url}` into a temporary workspace directory.
2. Run Security Analysis:
   - **L1 Trust Signal:** Stars, contributors, last commit date, license type, org reputation.
   - **L2 Secret Scan:** Scan source for hardcoded API keys, credentials, tokens.
   - **L3 Dependency Audit:** Check `package.json`, `requirements.txt`, `Cargo.toml` for known vulnerabilities, heavy or risky dependencies.
   - **L4 Behavioral Analysis:** Identify unprompted network calls, filesystem writes, excessive permissions, eval/exec usage.
3. **Execute License Guardian:** Invoke the `license-compliance-guardian` skill to evaluate the `LICENSE` file against Cowok.ai's whitelist/blacklist.

**Gate:** If L2 (secrets found) or L4 (malicious behavior detected) or License Check fails → **BLOCK**. Report risk to user. Do NOT proceed without explicit user override.

---

## Step 3: Source Code Deep Read

Do NOT rely solely on README. Read actual source code to discover the full feature set.

1. **Repomix Dependency Check:** Ask the user: *"Bước này sử dụng `repomix` để nén codebase. Môi trường của bạn đã cài sẵn `repomix` chưa? Nếu chưa, bạn có muốn tôi tự động cài đặt (Global hay Project-only) không?"*
   - If User approves global: `npm install -g repomix`
   - If User approves local: `npm install repomix`
   - If User declines: **Fallback** to standard manual file reading.
2. **Context Packaging:** If Repomix is available, run it to generate a single context file. Otherwise, manually identify entry points (`main`, `cli`, `bin`, `__main__.py`).
3. **Core Logic Files:** Read the Repomix context (or top 5-10 files by import count/size). Extract execution flow.
4. **Config & Schema Files:** Read `package.json` scripts, `pyproject.toml`, `Cargo.toml` features, CLI help output.
5. **Hidden Feature Discovery:** Search for CLI flags, environment variables, config parameters, and capabilities NOT mentioned in README.
6. **Output:** A complete list of **actual capabilities** discovered from source code.

---

## Step 4: Community Intelligence

Research what the community actually says about this tool. README is marketing — community is truth.

**GitHub MCP Connect Check:** Ask the user: *"Bước này dùng `community-sentiment-scraper` qua GitHub MCP. Môi trường của bạn đã connect GitHub MCP chưa? Nếu chưa, bạn có muốn tôi setup kết nối không?"*
- If yes, configure MCP. If no, fallback to web search.

**Mandatory sources (4+ required):**

| Source | Method | Extract |
|--------|--------|---------|
| GitHub Issues / Discussions | Invoke `community-sentiment-scraper` skill (via MCP or Web Search Fallback) | Common bugs, feature requests, breaking changes, maintainer responsiveness, real-world use cases |
| Reddit / Hacker News | `search_web "{repo-name} site:reddit.com"` | Overall sentiment, praise, criticism, alternatives mentioned |
| Dev.to / Medium / Blogs | `search_web "{repo-name} tutorial"` | Community applications, workarounds for limitations |

**Output:** Community Sentiment Summary with 5 mandatory fields:
- **Praise (Khen)**
- **Criticism (Chê)**
- **Real-World Usage (Cộng đồng dùng ra sao)**
- **Known Gotchas (Bẫy/Bug nổi tiếng)**
- **Alternative Mentions (So sánh với tool nào)**

---

## Step 5: Use-Case Definition

Define **minimum 3 Use Cases** specific to Cowok.ai.

Each Use Case MUST:
- Reference a specific Epic, FR, or User Journey from the PRD.
- Describe WHO uses it (which department/role in Cowok.ai).
- Describe WHAT problem it solves for Cowok.ai specifically.

Example format:
```
Use Case 1: [Epic 15 - Wiki OS] HR department uploads 500 PDF employee contracts.
Semble indexes all parsed Markdown content in ~250ms, enabling instant semantic
search across the entire HR knowledge base without consuming LLM tokens.
```

---

## Step 6: 5-Lens User Simulation

Load context: `project-context.md`, PRD (`_iwish-output/2. Product Planning/2.1. product-brief-or-prd.md`).

**Mandatory: Run ALL 5 Lenses.**

### Group 1 — End-User Value (3 Lenses required)

| Lens | Perspective | Mandatory Question |
|------|------------|-------------------|
| **L1: Department** | Simulate 3+ departments (e.g., Finance, Marketing, HR) | "How does [Department X] use this tool? What's the UX? What edge case arises?" (MUST list ≥3 Use Cases) |
| **L2: Industry** | Simulate 3+ industries (e.g., E-commerce, Agency, Healthcare) | "Does industry [X] have special requirements? What's the limit rate at their scale?" (MUST list ≥3 Use Cases) |
| **L3: Target Customer** | Simulate SME (Cowok.ai target market) | Evaluate at least 3 adoption criteria (e.g., Zero-IT, Onboarding, Self-serve). (MUST list ≥3 Criteria) |

### Group 2 — Operational Value (2 Lenses required)

| Lens | Perspective | Mandatory Question |
|------|------------|-------------------|
| **L4: Cost Optimization** | Compare cost vs current solution | Compare at least 3 cost factors (e.g., RAM, Tokens, Infra $/mo). (MUST list ≥3 Criteria) |
| **L5: Speed & Accuracy** | Benchmark latency, throughput, accuracy | Compare at least 3 performance factors (e.g., Latency, Throughput, Accuracy). (MUST list ≥3 Criteria) |

### Gate Check:
- [ ] All 5 Lenses simulated
- [ ] **Each Lens MUST have at least 3 detailed use cases or evaluation criteria documented.**
- [ ] Each Use Case has at least 1 Edge Case discovered
- [ ] Each Use Case has a specific Limit Rate documented (at what scale does it break)

---

## Step 7: Sandbox Test & Metrics

Install the tool in an isolated environment and run real examples.

0. **MEnvAgent Dependency Check:** Ask the user: *"Bước này khuyến nghị dùng `MEnvAgent` để thiết lập môi trường an toàn. Bạn có muốn tự động cài/sử dụng MEnvAgent không?"*.
   - If User approves: Setup via MEnvAgent.
   - If User declines: **Fallback** to local ad-hoc installation.
1. **Install:** Record install time, binary/package size, dependency count.
2. **Run:** Execute 2-3 real-world examples relevant to Cowok.ai use cases.
3. **Automated Benchmark Scaffold:** Invoke the `automated-benchmark-scaffold` skill to generate and execute an objective performance script (`hyperfine` for CLI, `k6` for API, vb.).
4. **Measure (via Benchmark):**
   - Latency (ms) — actual measured, not claimed
   - RAM peak usage (MB)
   - CPU usage pattern (burst vs sustained)
   - Error handling behavior (what happens on bad input?)
   - Output format & token density (is output LLM-friendly?)
5. **Record:** All metrics in a structured table.

---

## Step 8: Compare & Contrast — Dual-Direction Gap Analysis

### Direction 1: Versus Current Tech Stack
- Read `project-context.md` Section 1 (Technology Stack & Versions).
- Identify which current technology this tool could replace or complement.
- Compare head-to-head on: latency, cost, accuracy, ease of use, maintenance burden.

### Direction 2: Versus R&D Library Alternatives
- Run `python3 scripts/query_library.py --tag [relevant-tag]` to find existing alternatives.
- If alternatives exist in the library, compare head-to-head.
- If no alternatives exist, note this tool as the first entry for this capability.

### Output: Pros & Cons Comparison Matrix (mandatory)

```markdown
| Criteria | [New Tool] | [Current Tech] | [Library Alternative] |
|----------|------------|-----------------|----------------------|
| Latency  |            |                 |                      |
| RAM      |            |                 |                      |
| Cost/mo  |            |                 |                      |
| Accuracy |            |                 |                      |
| Zero-IT  |            |                 |                      |
| Maturity |            |                 |                      |
```

---

## Step 9: Track Recommendation

Based on ALL analysis from Steps 1-8, issue a **mandatory track recommendation:**

| Track | Description | When to Choose |
|-------|-------------|---------------|
| **INTERNAL** | Add to Cowok.ai's tech stack (system uses internally) | Tool solves infrastructure, pipeline, or agent runtime problems |
| **PLUGIN** | Package as a plugin for end-users via chat/workflow | Tool solves specific business tasks for end-users |
| **BOTH** | Add to tech stack AND expose as user plugin | Tool has value on both sides |

**Output:**
- Track: `INTERNAL` / `PLUGIN` / `BOTH`
- Justification: Why this track was chosen.
- If `BOTH`: List which use cases are Internal and which are Plugin.

---

## Step 10: Document Generation

1. Generate the final evaluation using `docs/R&D-Library/templates/rd-template.md`.
2. Save to the appropriate directory:
   - `INTERNAL` → `docs/R&D-Library/internal/{tool-name}.md`
   - `PLUGIN` → `docs/R&D-Library/plugins/{tool-name}.md`
   - `BOTH` → Save to BOTH directories (one file, symlinked).
3. Append the metadata entry to `docs/R&D-Library/R&D-Library.yaml`.
4. Clean up: Remove cloned repo from temporary workspace.
