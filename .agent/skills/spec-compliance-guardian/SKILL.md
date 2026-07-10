---
name: Spec Compliance Guardian
description: Ensures structural synchronization between specification documents (UI Spec, Data Spec, Story AC/Tasks) and actual implemented code. Detects spec-code drift that dev-agent and review-agent may miss.
---

# Spec Compliance Guardian SKILL

## Purpose

Closes the **Spec Compliance Gap** identified by the AI Council audit (2026-07-08). The I-Wish pipeline excels at code quality (tsc, prisma validate, anti-cheat) and code safety (cross-story conflicts, backward compat), but has near-zero **spec compliance** verification — i.e., whether the code actually implements what the spec defined.

This skill provides structural diffing, AC traceability, and compliance scoring to bridge that gap.

## When to Use

- **During `/dev-story` (CD-02)**: As Spec Re-Read Checkpoint after every 3-5 tasks
- **During `/dev-story` (CD-03)**: Before finalizing story, generate AC Traceability Matrix
- **During `/review` (Layer 1.5)**: Mandatory spec loading and structural diff
- **During `/manual-test`**: As pre-flight spec compliance check
- **On-demand**: When suspecting implementation drift from specifications

---

## 1. Spec Loading Protocol (Mandatory Pre-Flight)

Before ANY implementation or review work, the agent MUST load and keep active reference to:

```
MANDATORY SPEC LOADING CHECKLIST:
□ Story file (with all ACs and Tasks)
□ UI Spec file (if story involves UI changes)
□ Data Spec file (if story involves data/API changes)  
□ api-routes.ts contract (if story involves API changes)
□ DESIGN.md / ux-patterns.yaml (if story involves new UI patterns)

If any required spec file is MISSING → HALT with "Missing spec" error.
Do NOT proceed without all applicable specs loaded.
```

### Spec Location Resolution

Use the Layout Mode rules from AGENTS.md:
- **Flat:** `_iwish-output/stories/ui-spec-story-{id}.md`, `data-spec-story-{id}.md`
- **Hierarchical:** `.../{Feature_Group}/Epic-{epic_id}/Story-{story_id}/ui-spec.md`, `data-spec.md`
- **Evolution Lab:** `.agent/evolution-lab/stories/ui-spec-story-{id}.md`, `data-spec-story-{id}.md`

---

## 2. Structural Diff Checks

### 2.1 UI Spec ↔ Code Diff

Extract and verify these dimensions from the UI Spec against actual code:

| Check ID | Dimension | What to Extract from UI Spec | How to Verify in Code | Severity |
|----------|-----------|------------------------------|----------------------|----------|
| `UI-1` | **Component Hierarchy** | Component tree (names, nesting, parent-child) | Verify matching React/Vue component files exist with correct import hierarchy | 🔴 Critical |
| `UI-2` | **Design Tokens** | Colors, spacing, typography, shadows referenced | `grep` code for correct token usage vs hardcoded values | 🔴 Critical |
| `UI-3` | **Responsive Rules** | Breakpoint definitions, layout changes per breakpoint | Check Tailwind/CSS breakpoint classes match spec | 🟠 High |
| `UI-4` | **State Definitions** | Loading, empty, error, success states defined | Verify code paths exist for each state | 🟠 High |
| `UI-5` | **Interactive Elements** | Buttons, forms, modals, popovers, their behaviors | Verify event handlers and UI patterns exist | 🟡 Medium |
| `UI-6` | **Accessibility** | ARIA labels, keyboard nav, focus management | Verify a11y attributes in code | 🟡 Medium |

#### UI Diff Output Format

```markdown
## UI Spec Compliance Report

| Check | Spec Definition | Code Implementation | Status |
|-------|----------------|---------------------|--------|
| UI-1: FilterPanel component | Defined in §3.2 as child of ProductListPage | ❌ NOT FOUND — filtering is inline in parent | 🔴 MISSING |
| UI-2: Primary color | `--color-primary: #00DF9A` | ✅ Used correctly in 12/12 references | ✅ PASS |
| UI-3: Mobile stack layout | "Stack to single column below md" | ❌ Always 2-column layout, no `md:` breakpoint | 🔴 DRIFT |
| UI-4: Empty state | "Show illustration + CTA when no items" | ⚠️ Shows "No data" text only, no illustration | 🟡 PARTIAL |

SCS_UI = 8/16 = 50% ← BELOW THRESHOLD (80%)
```

### 2.2 Data Spec ↔ Code Diff

| Check ID | Dimension | What to Extract from Data Spec | How to Verify in Code | Severity |
|----------|-----------|-------------------------------|----------------------|----------|
| `DATA-1` | **Entity Fields** | Model name, field names, types, constraints | `view_file` on `schema.prisma` — compare field-by-field | 🔴 Critical |
| `DATA-2` | **DTO Contracts** | Request/Response shapes with field names and types | Compare with actual TypeScript interfaces in controllers/api-client | 🔴 Critical |
| `DATA-3` | **API Routes** | HTTP method + path + params | Compare with `api-routes.ts` and actual controller decorators | 🔴 Critical |
| `DATA-4` | **Relations** | FK references, cascade rules, many-to-many joins | Verify in Prisma schema `@relation` directives | 🟠 High |
| `DATA-5` | **Constraints** | Unique, required, default values, enums | Verify decorators and validators in code | 🟠 High |
| `DATA-6` | **Type Boundary Mapping** | Decimal→number, DateTime→string, nullable handling | Check DTO converters at API boundary | 🟡 Medium |

#### Data Diff Output Format

```markdown
## Data Spec Compliance Report

| Check | Spec Definition | Code Implementation | Status |
|-------|----------------|---------------------|--------|
| DATA-1: User.deletedAt | `DateTime? @map("deleted_at")` | ❌ Field not in schema.prisma | 🔴 MISSING |
| DATA-2: POST /products Request | `{ name, price, categoryId, tags[] }` | ⚠️ `{ name, price, categoryId }` — missing `tags` | 🟡 PARTIAL |
| DATA-3: PATCH /users/:id | Method: PATCH | ❌ Controller uses `@Put()` instead | 🔴 DRIFT |
| DATA-4: Product→Category FK | `@relation(fields: [categoryId])` | ✅ Correctly defined | ✅ PASS |

SCS_DATA = 6/12 = 50% ← BELOW THRESHOLD (90%)
```

### 2.3 AC/Task ↔ Code Traceability Matrix

For every Acceptance Criterion and every Task in the story, the agent MUST produce a traceability row:

```markdown
## AC Traceability Matrix

| AC/Task ID | Description | Code Artifact(s) | Test Artifact(s) | Status |
|------------|-------------|-------------------|-------------------|--------|
| AC-1 | User can search products by name | `ProductList.tsx:L45-L78` (SearchInput + useSearch hook) | `product-list.test.tsx:L23` | ✅ COVERED |
| AC-2 | Search results highlight matching text | ❌ NO CODE FOUND | ❌ NO TEST | 🔴 MISSING |
| AC-3 | Empty search shows "No results" message | `ProductList.tsx:L82-L90` (EmptyState component) | `product-list.test.tsx:L56` | ✅ COVERED |
| Task-4.1 | Implement debounced search (300ms) | `useSearch.ts:L12` (useDebounce hook) | ❌ NO TEST for debounce timing | 🟡 PARTIAL |
| Task-4.2 | Add search analytics event | ❌ NO CODE FOUND | ❌ NO TEST | 🔴 MISSING |

AC Coverage: 2/3 = 66% ← BELOW THRESHOLD (95%)
Task Coverage: 1/2 = 50% ← BELOW THRESHOLD (90%)
```

#### Traceability Rules

1. **Every AC MUST have at least one Code Reference** — If empty → 🔴 BLOCK
2. **Every AC SHOULD have at least one Test Reference** — If empty → 🟡 WARN (configurable to BLOCK)
3. **Every Task MUST have a verifiable code change** — If empty → 🔴 BLOCK
4. **No orphan code** — Code artifacts NOT linked to any AC/Task should be flagged for review

---

## 3. Spec Compliance Score (SCS)

### 3.1 Score Calculation

```
SCS = Weighted Average of:
  - SCS_UI × 0.30    (if UI changes present)
  - SCS_DATA × 0.30  (if data changes present)
  - SCS_AC × 0.40    (always applicable)

Where:
  SCS_UI   = (Passed UI checks + 0.5 × Partial) / Total UI checks × 100
  SCS_DATA = (Passed Data checks + 0.5 × Partial) / Total Data checks × 100
  SCS_AC   = (Covered ACs + 0.5 × Partial ACs) / Total ACs × 100
```

### 3.2 Thresholds

| Pipeline Stage | Minimum SCS | Action if Below |
|---------------|:-----------:|-----------------|
| Post-Dev (CD-03 exit) | **≥ 75%** | HALT — fix before proceeding to review |
| Post-Review (Layer 1.5 exit) | **≥ 85%** | REJECT review — send back to dev |
| Post-QA (final) | **≥ 90%** | BLOCK release |

### 3.3 Drift Escalation

| SCS Range | Classification | Action |
|-----------|---------------|--------|
| 90-100% | 🟢 **Compliant** | Proceed normally |
| 75-89% | 🟡 **Minor Drift** | Fix before next stage |
| 50-74% | 🟠 **Significant Drift** | HALT — user review required |
| 0-49% | 🔴 **Critical Drift** | BLOCK — re-read specs and re-implement |

---

## 4. Spec Re-Read Checkpoint (During Development)

To prevent context window loss during long implementations:

```
SPEC RE-READ TRIGGER CONDITIONS:
1. After every 3-5 completed tasks
2. After any context window checkpoint/truncation event
3. Before starting a new "boundary module" (API endpoint, DB schema, new component)
4. Before the final self-check (step-04)

PROCEDURE:
1. Reload the applicable spec file(s) using view_file
2. Cross-reference current implementation against spec
3. Note any drift detected
4. If drift > 2 items → HALT and remediate before continuing
```

---

## 5. Integration Points

### 5.1 For Dev Agent (`/dev-story`)

Insert in **step-cd-02** after Socratic Review Gate 3:
```
4.7b. CRITICAL — SPEC RE-READ CHECKPOINT. After completing every 3 tasks
(or after any context truncation event), you MUST re-read the applicable
spec files (UI Spec and/or Data Spec) using view_file and cross-check
your current implementation. If you detect more than 2 drift items,
HALT and remediate before continuing.
```

Insert in **step-cd-03** before Story Status Update:
```
NEW GATE — AC TRACEABILITY MATRIX. Before marking story as dev_completed,
you MUST generate an AC Traceability Matrix following
.agent/skills/spec-compliance-guardian/SKILL.md §2.3.
Every AC must have a Code Reference. Output the matrix in the walkthrough.
If AC Coverage < 95%, HALT and implement missing items.
```

### 5.2 For Review Agent (`/review`)

Insert as **Layer 1.5** in 3-Layer Code Review Protocol:
```
LAYER 1.5 — SPEC STRUCTURAL GATE (NEW)
Before Layer 2 Adversarial Audit:
1. LOAD all applicable spec files (story, UI spec, data spec)
2. Run Spec Compliance Guardian checks (§2.1, §2.2, §2.3)
3. Calculate SCS score
4. If SCS < 85% → REJECT with detailed diff report
5. If SCS ≥ 85% → Record SCS in review report, proceed to Layer 2
```

### 5.3 For QA Agent (`/manual-test`)

Insert as **pre-flight** before test execution:
```
PRE-FLIGHT — SPEC COMPLIANCE PRE-CHECK
Before executing manual tests:
1. Load the AC Traceability Matrix from dev walkthrough
2. Verify all ACs marked as COVERED actually function in the running app
3. Record final SCS_Final score
```

---

## 6. Output Format

When invoked, output the following block:

```
🛡️ [SPEC-COMPLIANCE-GUARDIAN] COMPLIANCE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Story: {story_id}
Specs Loaded: UI Spec ✅ | Data Spec ✅ | Story ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UI Spec Compliance:   {score}% ({passed}/{total} checks)
Data Spec Compliance: {score}% ({passed}/{total} checks)  
AC Coverage:          {score}% ({covered}/{total} ACs)
Task Coverage:        {score}% ({covered}/{total} tasks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERALL SCS:          {weighted_score}%
DISPOSITION:          {COMPLIANT | MINOR_DRIFT | SIGNIFICANT_DRIFT | CRITICAL_DRIFT}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[DRIFT ITEMS]
1. 🔴 UI-1: FilterPanel missing — spec §3.2, not found in code
2. 🔴 DATA-1: User.deletedAt missing from schema.prisma
3. 🟡 AC-2: Search highlight — partial implementation
...
```

---

## 7. Relationship to Existing Skills

| Existing Skill | Relationship | Boundary |
|---------------|-------------|----------|
| **API Contract Guardian** | Complementary | API CG checks route consistency; this skill checks if routes match the *spec* |
| **Data Integrity Guardian** | Complementary | DIG checks naming conventions/patterns; this skill checks if schema matches *Data Spec* |
| **Visual Fidelity Gate** | Complementary | VFG checks DOM vs Design Source; this skill checks component hierarchy vs *UI Spec* |
| **UX Guardian** | Complementary | UXG enforces behavioral tokens; this skill checks state definitions vs *UI Spec* |
| **QA Simulator Guardian** | Complementary | QSG produces Hybrid Scorecard; this skill produces *SCS score* |
| **Design Compliance Scanner** | Subset overlap | Scanner checks token compliance; this skill has broader scope including components + states |

---

## 8. Anti-Fabrication Hardening (Who Watches the Watchmen?)

The Spec Compliance Guardian is itself subject to fabrication risks — agents may claim compliance without actually performing checks. This section defines 3 tiers of defense against fabrication.

> **Reference:** `.agent/fragments/anti-fabrication-watchmen-pattern.md` for the universal pattern.

### 8.1 Tầng 1: Deterministic Enforcement (Script-Verified Gates)

The following checks MUST be performed via `run_command` with `spec-compliance-checker.py`, NOT by agent self-reporting:

```
DETERMINISTIC GATES (Agent CANNOT fabricate):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Component existence check    → grep-verified, exit code
✅ Prisma model existence       → schema.prisma parse, exit code  
✅ AC count extraction          → regex parse from story.md
✅ Task count extraction        → regex parse from story.md
✅ Script SCS output            → JSON line in stdout
✅ Exit code (0=pass, 1=fail)   → Cannot be faked

TRUST-BASED GATES (Require Tầng 2 & 3 to verify):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Spec was actually loaded     → Verify via evidence trail
⚠️ Structural diff was honest   → Cross-agent verification
⚠️ SCS score is accurate        → Independent recalculation
⚠️ Drift items were all found   → Cross-agent verification
⚠️ Re-read checkpoint executed  → Verify via tool call trace
```

**MANDATORY RULE:** Whenever a compliance check is performed, the agent MUST invoke `run_command` to execute:
```bash
python3 .agent/scripts/spec-compliance-checker.py <path-to-story.md> [--ui-spec <path>] [--data-spec <path>]
```
The agent MUST paste the COMPLETE raw stdout output — including the `[JSON]` line — into the compliance report. Agents are FORBIDDEN from summarizing, paraphrasing, or selectively quoting the script output. The raw output IS the evidence.

### 8.2 Tầng 2: Cross-Agent Independent Verification

To prevent single-agent bias, the pipeline enforces independent verification:

```
CROSS-AGENT VERIFICATION PROTOCOL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. DEV AGENT produces:
   - AC Traceability Matrix
   - SCS_dev score (from checker.py output)
   - Drift item list

2. REVIEW AGENT must INDEPENDENTLY:
   - Re-run spec-compliance-checker.py (its own invocation)
   - Produce SCS_review score
   - Compare: |SCS_dev - SCS_review| > 10% → SUSPICIOUS
   - If suspicious → ESCALATE to user with both scores

3. TRUST SCORE ADJUSTMENT:
   - If dev SCS and review SCS match (±5%): Trust Score += 1
   - If dev SCS optimistically inflated (>10% higher): Trust Score -= 2
   - Trust Score < 0 → BLOCK story, require user audit
```

**CRITICAL RULE for Review Agent:** The review-agent MUST NOT trust or reference the SCS score reported by dev-agent. The review-agent MUST run `spec-compliance-checker.py` independently and calculate its OWN SCS score. Any review that references dev-agent's SCS score without independent verification is INVALID.

### 8.3 Tầng 3: Evidence Trail (Audit Log Requirements)

Every spec compliance check MUST produce verifiable evidence:

```
EVIDENCE REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SPEC_LOAD_EVIDENCE:
   - Agent MUST use `view_file` tool to load each spec
   - The tool call ID is recorded in the conversation transcript
   - If no `view_file` call for spec exists in transcript → SPEC NOT LOADED
   - Claiming "I have already read the spec" without a traceable
     `view_file` call is FABRICATION

2. DIFF_EVIDENCE:
   - Agent MUST paste RAW diff output (not summarized)
   - Minimum: 1 code block for UI diff, 1 code block for Data diff
   - Each diff item must reference specific file:line in the codebase
   - References MUST be verifiable via `view_file` or `grep_search`

3. SCS_EVIDENCE:
   - Script output MUST contain the [JSON] line from checker.py
   - Agent MUST NOT modify, round, or "adjust" the JSON output
   - Review agent MUST cross-reference JSON values vs prose report
   - If prose SCS ≠ JSON SCS → FABRICATION DETECTED → REJECT

4. MATRIX_EVIDENCE:
   - AC Traceability Matrix MUST contain file:line references
   - Review agent MUST spot-check at least 3 random file:line refs
   - If any reference points to non-existent code → FABRICATION
   - Spot-check method: `view_file <path> --start <line> --end <line>`
```

### 8.4 Fabrication Detection Heuristics

| # | Red Flag | Detection Method | Action |
|---|---------|-----------------|--------|
| 1 | Agent reports SCS without `run_command` in transcript | Transcript audit | REJECT — require script run |
| 2 | Agent claims "spec loaded" but no `view_file` for spec file | Transcript audit | REJECT — require re-load |
| 3 | Dev SCS > Review SCS by >10% | Cross-agent comparison | ESCALATE to user |
| 4 | All AC references point to same file | Matrix pattern analysis | FLAG — likely copy-paste |
| 5 | AC matrix has no test references | Matrix completeness | WARN — may be real but suspicious |
| 6 | Agent produces compliance report in <30 seconds | Timing analysis | FLAG — too fast for real analysis |
| 7 | Drift count = 0 on first implementation | Statistical improbability | FLAG — verify independently |

### 8.5 Enforcement Escalation Chain

```
Level 0: Script gate passes              → Proceed normally
Level 1: Trust-based gate fails          → Agent must remediate and re-run
Level 2: Cross-agent SCS mismatch        → User notification + audit
Level 3: Evidence trail missing           → BLOCK story + full audit
Level 4: Fabrication confirmed            → REJECT entire review/implementation
```

---

## 9. Gate Classification

| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| G-1 | Component existence | A (Deterministic) | grep exit code via checker.py | Script stdout |
| G-2 | Prisma model existence | A (Deterministic) | schema.prisma parse via checker.py | Script stdout |
| G-3 | AC/Task count | A (Deterministic) | regex parse via checker.py | JSON output |
| G-4 | Script SCS score | A (Deterministic) | checker.py calculation | `[JSON]` line |
| G-5 | Spec file loading | B (Trust-Based) | `view_file` tool call | Transcript audit |
| G-6 | UI structural diff | B (Trust-Based) | Agent comparison | Raw diff block in report |
| G-7 | Data structural diff | B (Trust-Based) | Agent comparison | Raw diff block in report |
| G-8 | AC→Code mapping | B (Trust-Based) | Agent traces code | file:line spot-check |
| G-9 | AC→Test mapping | B (Trust-Based) | Agent traces tests | file:line spot-check |
| G-10 | Drift item detection | B (Trust-Based) | Agent judgment | Cross-agent verification |
| G-11 | SCS final calculation | A+B (Hybrid) | Script base + agent semantic | JSON vs prose cross-check |
| G-12 | Spec re-read checkpoint | B (Trust-Based) | `view_file` recurrence | Transcript audit |

**Enforcement Maturity:** 5/12 = 42% Category A → Medium Maturity ✅

