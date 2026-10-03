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

The Spec Compliance Score (SCS) is computed mechanically by the `spec-compliance-checker.py` script. The formula is:

```
SCS = Weighted Average of:
  - SCS_UI × 0.30    (if UI Spec is present)
  - SCS_DATA × 0.30  (if Data Spec is present)
  - SCS_AC × 0.40    (always applicable)

Where:
  SCS_UI   = percentage of extracted UI tokens (from Screen Inventory, Component Hierarchy, Design Tokens, Interaction Patterns) found in the codebase.
  SCS_DATA = percentage of extracted Data tokens (from Data Contracts, Prisma/Schema) found in the codebase.
  SCS_AC   = percentage of Acceptance Criteria marked as completed in story.md matrix or checked off in task.md.
```

### 3.2 Thresholds

| Pipeline Stage | Minimum SCS | Action if Below |
|---------------|:-----------:|-----------------|
| Post-Dev (CD-03 exit) | **≥ 75%** | HALT — fix before proceeding to review |
| Post-Review (Layer 1.5 exit) | **≥ 95%** | REJECT review — send back to dev |
| Post-QA (final) | **≥ 90%** | BLOCK release |

### 3.3 Drift Escalation

SCS values are loaded directly from `checker-output-{id}.json` by the pipeline:
- **90-100% (🟢 Compliant):** Proceed normally.
- **75-89% (🟡 Minor Drift):** Fix before proceeding to review.
- **50-74% (🟠 Significant Drift):** HALT — user review required.
- **0-49% (🔴 Critical Drift):** BLOCK — re-read specs and re-implement.

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

Insert in **step-cd-02** under Tier 1 Hard Gates:
```
4.7b. CRITICAL — SPEC RE-READ CHECKPOINT. After completing every 3 tasks
(or after any context truncation event), you MUST re-read the applicable
spec files (UI Spec and/or Data Spec) using view_file and run the
spec-compliance-checker.py script to compare your current implementation.
If SCS drops > 10% from baseline, HALT and remediate.
```

Insert in **step-cd-03** before Story Status Update:
```
NEW GATE — BASENAMES & PHYSICAL ARTIFACTS. Before marking story as completed:
1. Re-run spec-compliance-checker.py to output checker-output-{id}.json
2. Run anti-cheat-linter.js to output linter-output-{id}.json
3. Verify exit code of both is 0. If SCS < 75% or unapproved mocks exist, HALT and fix.
```

### 5.2 For Review Agent (`/review`)

Insert as **Layer 1.5** in 3-Layer Code Review Protocol:
```
LAYER 1.5 — SPEC COMPLIANCE PHYSICAL GATE (NEW)
Before proceeding with Layer 2 review:
1. Run verify-review-evidence.py to automatically verify all evidence.
   python3 .agent/scripts/verify-review-evidence.py <story_dir> <story_id> --ui-spec <path> --data-spec <path> --story <path> --scs-threshold 95
2. If the command exits 1 → REJECT immediately. Do NOT calculate SCS manually.
3. If it exits 0 → Record results in review report and proceed.
```

### 5.3 For QA Agent (`/manual-test`)

Insert as **pre-flight** before test execution:
```
PRE-FLIGHT — EVIDENCE VALIDATION
Before executing manual tests:
1. Run verify-review-evidence.py --scs-threshold 90 to ensure release quality.
2. If it exits 1 → BLOCK test execution.
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

## 8. Anti-Fabrication Hardening (Physical Artifact Chain)

The Spec Compliance Guardian prevents fabrication by enforcing a strict physical artifact chain verified by scripts, rather than trusting agent claims.

### 8.1 Tầng 1: Deterministic Script Enforcement (Cannot be Fabricated)

The pipeline requires physical `.json` artifact files containing execution outputs before a step is allowed to pass:

| Artifact | Generated By | verified By | Gate Checked |
|---|---|---|---|
| `checker-output-{id}.json` | `spec-compliance-checker.py` | `verify-review-evidence.py` | SCS score, spec file hashes, missing token list |
| `linter-output-{id}.json` | `anti-cheat-linter.js` | `verify-review-evidence.py` | Mock counts, auth mocks presence, localization |

Agents cannot write or modify these JSON files. They are generated strictly by the python/node scripts and check-summed dynamically using Normalized SHA-256 spec hashes.

### 8.2 Tầng 2: Independent Script-based Verification (The Referee)

The review agent does not trust reported scores. It must execute the `verify-review-evidence.py` script. The script is the final arbiter:
- It checks that `checker-output-{id}.json` and `linter-output-{id}.json` exist.
- It compares the stored `spec_hash` in `checker-output-{id}.json` against the live `spec_hash` of spec files. Any mismatch signals a **SSOT VIOLATION** (specs edited after checker ran).
- It verifies that the SCS is ≥ 95% (or 95% for release) and that no unapproved or auth mocks exist.

### 8.3 Tầng 3: Evidence Trail & Git Checkpoints

- **Script outputs:** Raw script output stdout block containing the `[JSON]` prefix must be visible in the conversation logs.
- **Physical files:** The `.json` artifact files remain in the story directory and are committed to the codebase alongside implementation files, establishing a permanent compliance trail.
- **No manual bypass:** If a mock is approved, it must be explicitly annotated in source code as `[MOCK_APPROVED]` to be accepted by `anti-cheat-linter.js`. Otherwise, the gate fails.

---

## 9. Gate Classification

| Gate ID | Description | Category | Enforcement Mechanism | Evidence Trail |
|---------|------------|----------|----------------------|----------------|
| G-1 | Token existence | A (Deterministic) | grep exit code via checker.py | JSON output |
| G-1.5 | Upstream spec format | A (Deterministic) | `validate-spec-format.py` | CLI stdout |
| G-2 | Prisma model presence | A (Deterministic) | `schema.prisma` parse via checker.py | JSON output |
| G-3 | Spec Hashing (SSOT) | A (Deterministic) | SHA-256 check via verifier | JSON spec_hash |
| G-4 | Script SCS score | A (Deterministic) | checker.py calculation | `checker-output.json` |
| G-5 | Mock checking | A (Deterministic) | `anti-cheat-linter.js` | `linter-output.json` |
| G-6 | Live Spec Sync | A (Deterministic) | `verify-review-evidence.py` check | Verifier output |
| G-7 | Spec re-read checkpoint | B (Trust-Based) | `view_file` recurrence | Transcript audit |

**Enforcement Maturity: High (7/8 gates are Category A Deterministic).**

