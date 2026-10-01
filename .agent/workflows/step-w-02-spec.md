---
description: 'Step W-02: Forge Specification — Gather sources and build the capability blueprint'
---

# Step W-02: Specification

## Objective
Collect all knowledge sources from the user and produce a structured `capability-spec.md` document that serves as the blueprint for the Forge phase.

## Instructions

### 1. Collect Data Sources

Ask the user for all relevant inputs. Supported source types:

| Source Type | How to Ingest |
|-------------|---------------|
| **Documentation URL** | Use `read_url_content` tool to crawl. Follow pagination/sub-pages recursively (max depth 3). |
| **GitHub Repository** | **MANDATORY 3-Layer MCP Deep Dive:** Use `github-mcp-server` to run a 3-layer scan:<br>1. Read `README`/`ARCHITECTURE.md`.<br>2. Scan file trees (via search/tree/list routes) specifically looking for `.github/workflows`, `.agents`, `scripts/`, or `prompts/`.<br>3. Use `get_file_contents` to extract and reverse-engineer the raw code/prompt logic of the core files found in Layer 2. NEVER rely solely on the README. |
| **NotebookLM / Knowledge Graph** | **MANDATORY Pre-Computation Research:** Invoke `/nlm pull` and `/ae-notebook-orchestrator` to gather internal context and similar capabilities *before* drafting the specification. Do not wait for post-creation hooks. |
| **PDF Document** | Ask user to place in project directory. Read with `view_file`. |
| **Raw Text / Paste** | User pastes content directly into chat. Capture as-is. |
| **Existing Codebase** | Use `grep_search`, `view_file_outline`, `view_code_item` to analyze patterns. |

### 2. Distill Key Knowledge

From the collected raw data, extract:
- **Core Concepts**: What are the 5-10 most important things an agent must know?
- **API Surface**: Key functions, classes, CLI commands, configuration options.
- **Anti-Patterns**: What should agents NEVER do with this technology?
- **Best Practices**: Established patterns and conventions.
- **Version-Specific Notes**: Breaking changes, migration paths, deprecated features.

### 3. Generate `capability-spec.md`

**MANDATORY: Adversarial Spec Review**
Before writing the spec, invoke `.agent/fragments/anti-sycophancy-guard.md` and perform a self-audit:
1. **The "Why Not" Test:** Provide one strong argument against building this capability.
2. **Failure Analysis:** If this skill leads to a production error, what is the most likely architectural cause?
3. **Redundancy Check:** Does this solve a problem that is already covered by an existing I-Wish fragment or skill?

Write the specification document to the runtime draft folder under `${IWISH_HOME:-${IWISH_HOME:-~/.iwish}}`:

```text
${IWISH_HOME}/generated-skills/<name>/capability-spec.md
${IWISH_HOME}/generated-workflows/<name>/capability-spec.md
${IWISH_HOME}/generated-agents/<name>/capability-spec.md
```

```markdown
# Capability Spec: <name>


### 4. Domain & Trigger Registration Planning
- Identify which Domains (e.g., UI/UX, AI Engineering, DevOps) this skill belongs to.
- Determine the keywords that should trigger this skill.
- Explicitly state in the Specification that the skill must be registered in `.agent/config/domain-skill-registry.yaml` during the Forge/Validate phase.


## Type: [SKILL / WORKFLOW / AGENT]
## Status: Draft
## Created: <date>

### Problem Statement
<what gap this capability fills>

### Knowledge Sources
- Source 1: <URL/path> — <what was extracted>
- Source 2: <URL/path> — <what was extracted>

### Core Concepts
1. <concept>
2. <concept>

### Anti-Patterns
- ❌ <thing to avoid>

### Best Practices  
- ✅ <recommended approach>

### Deliverables
- [ ] File 1: `.agent/skills/<name>/SKILL.md`
- [ ] File 2: (if workflow/agent)
```

### 4. Create Draft Metadata and Sprint Tracker

Create `metadata.yaml` alongside the spec:

```yaml
id: <name>
type: <SKILL|WORKFLOW|AGENT>
status: draft
origin:
  type: <memorygraph-derived|curator-recommendation|bug-fix|code-review|user-correction|evolution-lab|external-absorption|manual>
  created_by: create-skill
  created_at: <date>
  source_story: <story-id-or-null>
origin_repo: <source-url-or-null>
provenance:
  source_nodes:
    - id: <node-id-or-null>
      type: <Instinct|Learning|Bug|ReviewFinding|UserCorrection|CuratorRecommendation|EvolutionCase|ExternalSource>
      confidence: <1-10>
      sensitivity: <public|project|private|security-sensitive>
      ref: <path-or-story-or-bug-or-graph-id>
      status: <active|stale|superseded|low-confidence|sensitive>
  source_clusters: []
  source_artifacts:
    - capability-spec
evolution_lineage:
  parent_id: null
  generation: 1
  lineage_file: lineage.jsonl
promotion_target: <canonical-target-path>
path_policy: runtime
approval:
  required: true
  approved_by: null
  approved_at: null
```

Create `lineage.jsonl` alongside the spec with an initial `candidate_created` event following `.agent/fragments/capability-provenance-lineage.md`.

Create `forge-sprint-status.yaml` alongside the spec:
```yaml
capability: <name>
type: <SKILL/WORKFLOW/AGENT>
status: spec-approved
phases:
  triage: done
  spec: done
  forge: pending
  validate: pending
```

## Exit Criteria
- [ ] All data sources have been ingested and distilled
- [ ] `capability-spec.md` exists and is reviewed by user
- [ ] `metadata.yaml` exists with `status: draft`
- [ ] `lineage.jsonl` exists with an initial `candidate_created` event
- [ ] `forge-sprint-status.yaml` is created
- [ ] User approves the spec before proceeding to Forge


## State Machine Checkpoint & Anti-Skip Lock

> [!IMPORTANT]
> **STATE MACHINE UPDATE (MANDATORY):**
> Before exiting this step, you MUST update `state.json` atomically.
> 1. Write updated state (using strict JSON serialization tools) to `state.tmp.json` containing the new phase. The `"phase"` key MUST be validated against the strict Enum of expected phases.
> 2. Execute `mv state.tmp.json state.json`.
> 3. You MUST check for OS-level filesystem errors (e.g., disk full, permission denied) during the `mv` command and gracefully HALT if it fails.

> [!WARNING]
> **ANTI-SKIP LOCK (MANDATORY):**
> You MUST run the following command to validate integrity before proceeding:
> `python3 .agent/scripts/pipeline-integrity-runner.py --target "<capability_name>" --phase "<current_phase>"`
> - **Circuit Breaker:** If this script fails (non-zero exit), you MUST immediately HALT, report the error to the user, and do not retry more than 3 times. Do not silently ignore it.
