---
description: 'Step W-04: Validate — Lint, test, and register the new capability'
---

# Step W-04: Validation & Registration

## Objective
Verify that the newly created draft capability files are structurally sound, follow I-Wish conventions, and are ready for explicit promotion into the canonical system.

## Instructions

### 1. Structural Validation

#### For all generated capability drafts:
- [ ] Draft directory contains `metadata.yaml`, `lineage.jsonl`, and `promotion-plan.md`
- [ ] Draft directory also contains `integration-guide.md` and `integration-guide.html`
- [ ] Draft directory also contains `routing-profile.yaml`
- [ ] `metadata.yaml` follows `.agent/fragments/capability-provenance-lineage.md`
- [ ] `lineage.jsonl` has at least one append-only `candidate_created` event
- [ ] Loadable skill/workflow/agent content does not embed raw memorygraph dumps, transcripts, bug reports, review logs, or absorbed source artifacts
- [ ] Any stale, superseded, low-confidence, private, or security-sensitive source reference is flagged for curator/evolution review using `.agent/fragments/capability-authoring-curator-rules.md`
- [ ] If creating a Skill draft, apply `.agent/fragments/draft-skill-creation-governance.md` and verify draft creation gates passed before writing `${IWISH_HOME:-${IWISH_HOME:-~/.iwish}}/generated-skills/<name>/`
- [ ] If creating a Skill draft, verify the draft quality gate: trigger quality, scope boundary, frontmatter, anti-patterns, best practices, verification notes, provenance, lineage, promotion plan, and context budget
- [ ] If the Skill candidate overlaps an existing skill or adds only a small rule, verify `enhance-skill` patch/merge/split/rewrite routing was considered before allowing a new draft
- [ ] Review pack covers use cases, edge cases, stress cases, constraints, routing hints, and reviewer questions per `docs/iwish-adoption-review-pack-standard.md`
- [ ] Routing profile covers role, shape, phase, stage, triggers, anti-triggers, primary agents/workflows, and review-pack link per `docs/iwish-routing-profile-standard.md`

#### For SKILL files (`${IWISH_HOME:-${IWISH_HOME:-~/.iwish}}/generated-skills/<name>/SKILL.md`):
- [ ] File has valid YAML frontmatter with `name`, `description`, `inputs`, `outputs`, `mcp_tools_required`, and `subagent_triggers` fields
- [ ] Contains required sections: "When to Use", "Core Rules", "Anti-Patterns", "Best Practices"
- [ ] No broken markdown formatting (unclosed code blocks, missing headers)
- [ ] File size is reasonable (500-5000 lines; flag if outside this range)

#### For WORKFLOW files:
- [ ] Gateway `.md` file has valid YAML frontmatter with `name`, `description`, `inputs`, `outputs`, `mcp_tools_required`, and `subagent_triggers` fields
- [ ] All step files referenced in the gateway actually exist
- [ ] Step files follow naming convention: `step-<prefix>-NN-<name>.md`
- [ ] Each step has "Exit Criteria" section

#### For AGENT files:
- [ ] Agent `.md` has valid YAML frontmatter with `name`, `description`, `inputs`, `outputs`, `mcp_tools_required`, and `subagent_triggers` fields
- [ ] XML structure is well-formed (all tags properly opened and closed)
- [ ] `<activation>` section contains all 8 standard steps
- [ ] `<menu>` section has at least MH, CH, and DA items
- [ ] All `exec=` paths in menu items point to existing files

### 2. Convention Compliance

Run the following checks:
- [ ] File names use kebab-case (lowercase with hyphens)
- [ ] No hardcoded absolute paths (all use `{project-root}`, repo-relative paths, or `${IWISH_HOME}`)
- [ ] Draft files exist only under `${IWISH_HOME:-${IWISH_HOME:-~/.iwish}}/generated-*`
- [ ] Template wrapper draft exists when the promotion plan marks the capability public
- [ ] Promotion plan names the canonical `.agent/` and `templates/` destinations

### 3. Integration Smoke Test

- [ ] If creating a Skill draft: Verify another agent (e.g., Vegeta-agent) can reference the draft via `${IWISH_HOME:-${IWISH_HOME:-~/.iwish}}/generated-skills/<name>/SKILL.md`; verify canonical `{project-root}/.agent/skills/<name>/SKILL.md` only after promotion approval.
- [ ] If creating a Workflow draft: Verify the generated gateway `.md` under `${IWISH_HOME:-${IWISH_HOME:-~/.iwish}}/generated-workflows/<name>/` correctly chains to all generated step files; verify canonical `.agent/workflows/` paths only after promotion approval.
- [ ] If creating an Agent draft: Verify the generated agent under `${IWISH_HOME:-${IWISH_HOME:-~/.iwish}}/generated-agents/<name>/` can be parsed and has menu structure; verify canonical `.agent/agents/` paths only after promotion approval.

### 3b. Empirical Baseline Testing ("With vs Without" Validation)

**CRITICAL RULE:** Do NOT promote a skill draft if it fails empirical baseline testing.

- [ ] **Test Set Selection (Anti-Bias):** The test query MUST be extracted from the original user request/failure log that triggered the skill creation, or via Adversarial Sampling (e.g., edge cases). The authoring agent MUST NOT write the test.
- [ ] **Parallel Execution (A/B Testing):** Spawn two parallel isolated workspaces (e.g., via `invoke_subagent` with `Workspace: branch` or `/tournament`).
  - **Path A (Baseline):** Execute the test query WITHOUT loading the draft skill.
  - **Path B (Candidate):** Execute the test query WITH the draft skill loaded.
- [ ] **Double-Blind Evaluation:** Extract the outputs from Path A and Path B. Present them as "Output X" and "Output Y" to an independent evaluating agent (e.g., `review-agent`).
- [ ] **Rejection Criteria (Bloat Prevention):** The judge evaluates based on Accuracy, Token Efficiency, and Robustness. If Path B does not empirically outperform Path A (or crashes on edge cases), the validation **FAILS**. The draft MUST be rejected or returned for refinement.

### 4. Promotion Gate

Present the draft files, `metadata.yaml`, `lineage.jsonl`, `promotion-plan.md`, `integration-guide.md`, and `integration-guide.html` to the user. Wait for explicit approval before promoting.

If approved:
- Copy approved files into their canonical `.agent/` destinations.
- Sync `templates/` only when the promotion plan marks the capability public.
- Register the new capability with `.agent/scripts/add-to-kg.sh`.
- Run `.agent/scripts/validate-kg.sh`.
- Run `.agent/scripts/validate-portability.sh`.
- Update `metadata.yaml` from `status: draft` to `status: promoted`.
- Append a `candidate_promoted` event to `lineage.jsonl`.

If not approved, leave the draft under `${IWISH_HOME:-${IWISH_HOME:-~/.iwish}}` and do not change canonical repo files.

### 5. Register in System

- Log the new capability creation as an Instinct (meta-learning):
```jsonl
{"ts":"<today>","src":"create-skill","ctx":"meta,<capability-type>","bad":"capability gap","good":"<name> created","sev":1}
```
- Append the above to `.agent/memory/instincts.jsonl` only after promotion approval

### 6. Finalize Sprint Tracker

```yaml
phases:
  validate: done
status: complete
completed_at: <date>
```

### 7. Report to User

Present a summary:
```
✅ Capability Created Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: [SKILL / WORKFLOW / AGENT]
Name: <name>
Files Created:
  - <file 1>
  - <file 2>
  - ...
Next Steps:
  - <how to use the new capability>
  - <which agents benefit from it>
```

## Exit Criteria
- [ ] All structural validations pass
- [ ] Convention compliance verified
- [ ] Integration smoke test passed
- [ ] Empirical Baseline Testing (With vs Without) passed
- [ ] User approved promotion or draft was left unpromoted
- [ ] KG and portability validation pass after promotion
- [ ] Instinct logged after promotion approval
- [ ] Sprint tracker finalized
- [ ] User has received the completion report
