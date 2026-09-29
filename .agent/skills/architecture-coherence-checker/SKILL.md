---
name: architecture-coherence-checker
description: >
  Deterministic Architecture↔Story Tech-Stack Coherence Checker v2.
  TDR-first: reads tech-decision-registry.yaml (128+ entries, rejected alternatives)
  as SSOT, with body-scan fallback. Cross-references ADR technology decisions
  against story-level tech choices to detect infrastructure conflicts.
version: 2.0.0
trigger_contexts:
  - /evaluate-epic Step 2.5 (epic-wide ADR alignment)
  - /flow Step 1 (story-level AC gate)
  - /flow Step 4.5 (post-implementation defense-in-depth)
  - /party-mode Preamble (tech proposal verification)
  - /code Step CD-02 Gate 2.7 (import enforcement)
  - /retro Step 5a (epic drift evaluation)
  - /architecture-checker (standalone slash command)
inputs:
  - tech-decision-registry.yaml (TDR SSOT, primary)
  - architecture.md (fallback body-scan)
  - story.md (tags, cross-feature dependencies)
  - data-spec.md (technology references)
outputs:
  - coherence-report.json (conflicts, warnings, pass/fail)
  - MACRO risk auto-creation for unregistered technologies
gates:
  - type: deterministic
    name: TDR Parse Gate
    description: Reads tech-decision-registry.yaml SSOT with rejected alternatives
    enforcement: script
  - type: deterministic
    name: Story Tech Extract Gate
    description: Extracts technology references from story artifacts via regex
    enforcement: script
  - type: deterministic
    name: Cross-Reference Gate
    description: Compares TDR canonical stack vs story tech choices (4 conflict types)
    enforcement: script
enforcement_maturity: 100% Category A (fully deterministic)
---

# Architecture Coherence Checker

## Purpose

Prevents infrastructure conflicts by deterministically cross-referencing **active ADR technology decisions** against **story-level technology choices**. This skill closes the critical gap where Story 46.6 introduced Temporal.io while ADR 2.18 specified BullMQ as the canonical queue solution.

## When to Use

- **Mandatory:** During `/flow` Step 4.6 (Spec Compliance) and `/retro` Step 5a (Epic Drift)
- **On-demand:** Via `/architecture-checker` slash command
- **Auto-triggered:** When any story's `data-spec.md` or `story.md` references a technology not in the active ADR registry

## How It Works

### Phase 1: TDR Registry Loading (Deterministic)

Script reads `tech-decision-registry.yaml` from the same directory as `architecture.md`:

```
PRIMARY: tech-decision-registry.yaml → 128+ entries (decisions + rejected alternatives)
FALLBACK: architecture.md body-scan → heuristic regex (only if TDR absent)
```

The TDR contains:
- **48 technology decisions** extracted from ADR-2.1 through ADR-2.38
- **75+ rejected alternatives** auto-tracked as `deprecated` entries
- Each entry has: `category`, `chosen`, `status`, `phase`, `adr_ref`, `rationale`

Normalization: `_normalize_tdr_chosen()` maps TDR `chosen` values (e.g., `"bullmq"`, `"gcp-cloud-run"`) to regex-matchable keys used in `TECH_PATTERNS`. This prevents mismatches between TDR nomenclature and story content patterns.

Example TDR entry:
```yaml
- id: TDR-018-TEMPORAL
  adr_ref: "ADR-2.18"
  category: durable-execution
  chosen: temporal
  status: future
  phase: enterprise
  rationale: "Reserved for Phase 5+. Current phase uses BullMQ."
```

### Phase 2: Story Tech Extraction

Parse story artifacts to build a **Story Tech Manifest**:

```
INPUT: story.md, data-spec.md, ui-spec.md
OUTPUT: story-tech-manifest.json
```

Extraction sources:
1. `story.md` → `tags` array in frontmatter
2. `story.md` → "Cross-Feature Dependencies → Consumes" section
3. `data-spec.md` → `tags` array, API endpoint technology references
4. `data-spec.md` → Infrastructure/service references in body text

Technology detection patterns:
```
PATTERNS = [
  r'temporal\.io|temporal\s+sdk|temporal\s+client|temporal\s+worker',
  r'bullmq|bull\s+queue',
  r'eventbridge|event\s+bridge',
  r'redis|ioredis',
  r'kafka|confluent',
  r'rabbitmq|amqp',
  r'langchain|langgraph|lang\s+graph',
  r'prisma|drizzle|typeorm|sequelize',
  r'postgresql|postgres|mysql|mongodb|dynamodb',
  r'elasticsearch|opensearch|meilisearch',
  r'firebase|supabase|appwrite',
  r'stripe|paddle|lemonsqueezy'
]
```

### Phase 3: Cross-Reference & Conflict Detection

```
INPUT: TDR registry + story-tech-manifest
OUTPUT: coherence-report.json
```

Conflict classification (4 types):
1. **`premature-adoption` (HIGH):** Story uses a technology with `status: future` — not allowed in current phase
2. **`category-conflict` (CRITICAL):** Story uses a tech that conflicts with the active choice in its ADR category
3. **`deprecated-tech` (HIGH):** Story uses a technology explicitly deprecated by an ADR or MACRO decision
4. **`unregistered-tech` (MEDIUM):** Story uses a technology not found in any ADR entry
5. **`aligned` (PASS):** All story technologies match active ADR entries

**Rejected alternatives logic:** If a tech appears in TDR `alternatives_rejected` and has no `active`/`future` entry, it is auto-classified as `deprecated`. However, if it already has a `future` entry (e.g., Temporal in ADR-2.18), the future status takes precedence over any rejection from another ADR.

### Phase 4: Auto-Actions

When conflicts are detected:
1. **CRITICAL/HIGH:** Auto-create a MACRO risk entry in `macro-risks.yaml` with `confidence: 0.3` and `status: open`
2. **MEDIUM (unregistered):** Log a warning to `unknowns-ledger.yaml` with `severity: MEDIUM`
3. **Block pipeline:** If any CRITICAL/HIGH conflict exists, return exit code 1 to halt pipeline

## Usage

### Standalone (Slash Command)
```bash
# Check a single story
/architecture-checker --story 46.6

# Check an entire epic
/architecture-checker --epic 46

# Check all stories in current sprint
/architecture-checker --sprint-wide
```

### Script Invocation
```bash
python3 .agent/scripts/architecture-coherence-checker.py \
  --architecture "_iwish-output/2. Product Planning/2.5. architecture.md" \
  --story-dir "_iwish-output/3. Development/1. Epic & Story/FG-05-Workflow-Automation/Epic-46/Story-46.6" \
  --output-json "_iwish-output/adhoc-workspace/scratch/coherence-report-46.6.json"
```
The script auto-discovers `tech-decision-registry.yaml` in the same directory as the architecture file.

### Pipeline Integration (5-Layer Defense)

**Layer 1 — `/evaluate-epic` Step 2.5 (Earliest catch, epic-wide):**
Validates BEFORE any stories exist. Catches planned tech conflicts at the architecture level.
```bash
python3 .agent/scripts/architecture-coherence-checker.py \
  --architecture "_iwish-output/2. Product Planning/2.5. architecture.md" \
  --epic-dir "<epic_dir>" \
  --output-json "_iwish-output/adhoc-workspace/scratch/coherence-report-epic-<id>.json"
```
If FAIL → Epic CANNOT proceed to story creation.

**Layer 2 — `/flow` Step 1 `/make-story` (Story-level gate):**
Validates AFTER story ACs/dependencies are drafted but BEFORE specs are generated.
```bash
python3 .agent/scripts/architecture-coherence-checker.py \
  --architecture "_iwish-output/2. Product Planning/2.5. architecture.md" \
  --story-dir "<story_dir>" \
  --output-json "<story_dir>/coherence-report.json"
```
If FAIL → Story ACs must be rewritten to use canonical tech.

**Layer 3 — `/party-mode` Preamble (Tech proposal gate):**
Verifies any tech proposals from Socratic debate against ADR registry.

**Layer 4 — `/code` Step CD-02 Gate 2.7 (Real-time import enforcement):**
Catches technologies introduced via `import` or `require` statements DURING coding.

**Layer 5 — `/flow` Step 4.5 (Defense-in-depth, post-implementation):**
Final sweep catches technologies introduced DURING coding that were not in story/spec.
```bash
python3 .agent/scripts/architecture-coherence-checker.py \
  --architecture "_iwish-output/2. Product Planning/2.5. architecture.md" \
  --story-dir "<story_dir>" \
  --output-json "<story_dir>/coherence-report-post-impl.json"
```
If FAIL → Dev-agent must remediate before code review.

**Bonus — `/retro` via `evaluate-epic-drift.py`:**
`evaluate-epic-drift.py` delegates to this script automatically. TDR is used for accurate detection.

## Anti-Fabrication Compliance

| Gate | Category | Enforcement |
|---|---|---|
| ADR Parse Gate | A (Deterministic) | Script parses markdown, outputs JSON — verifiable |
| Story Tech Extract Gate | A (Deterministic) | Regex pattern matching on physical files — verifiable |
| Cross-Reference Gate | A (Deterministic) | JSON comparison with explicit rules — verifiable |

**Enforcement Maturity: 100% Category A** — All gates are fully deterministic with no trust-based checks.
