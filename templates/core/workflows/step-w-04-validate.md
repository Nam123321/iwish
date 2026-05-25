---
description: 'Step W-04: Validate — Lint, test, and register the new capability'
---

# Step W-04: Validation & Registration

## Objective
Verify that the newly created draft capability files are structurally sound, follow BMAD conventions, and are ready for explicit promotion into the canonical system.

## Instructions

### 1. Structural Validation

#### For all generated capability drafts:
- [ ] Draft directory contains `metadata.yaml`, `lineage.jsonl`, and `promotion-plan.md`
- [ ] `metadata.yaml` follows `.agent/fragments/capability-provenance-lineage.md`
- [ ] `lineage.jsonl` has at least one append-only `candidate_created` event
- [ ] Loadable skill/workflow/agent content does not embed raw memorygraph dumps, transcripts, bug reports, review logs, or absorbed source artifacts
- [ ] Any stale, superseded, low-confidence, private, or security-sensitive source reference is flagged for curator/evolution review using `.agent/fragments/capability-authoring-curator-rules.md`
- [ ] If creating a Skill draft, apply `.agent/fragments/draft-skill-creation-governance.md` and verify draft creation gates passed before writing `${IWISH_HOME:-${BMAD_HOME:-~/.iwish}}/generated-skills/<name>/`
- [ ] If creating a Skill draft, verify the draft quality gate: trigger quality, scope boundary, frontmatter, anti-patterns, best practices, verification notes, provenance, lineage, promotion plan, and context budget
- [ ] If the Skill candidate overlaps an existing skill or adds only a small rule, verify `enhance-skill` patch/merge/split/rewrite routing was considered before allowing a new draft

#### For SKILL files (`${BMAD_HOME}/generated-skills/<name>/SKILL.md`):
- [ ] File has valid YAML frontmatter with `name` and `description` fields
- [ ] Contains required sections: "When to Use", "Core Rules", "Anti-Patterns", "Best Practices"
- [ ] No broken markdown formatting (unclosed code blocks, missing headers)
- [ ] File size is reasonable (500-5000 lines; flag if outside this range)

#### For WORKFLOW files:
- [ ] Gateway `.md` file has valid YAML frontmatter with `name` and `description`
- [ ] All step files referenced in the gateway actually exist
- [ ] Step files follow naming convention: `step-<prefix>-NN-<name>.md`
- [ ] Each step has "Exit Criteria" section

#### For AGENT files:
- [ ] Agent `.md` has valid YAML frontmatter
- [ ] XML structure is well-formed (all tags properly opened and closed)
- [ ] `<activation>` section contains all 8 standard steps
- [ ] `<menu>` section has at least MH, CH, and DA items
- [ ] All `exec=` paths in menu items point to existing files

### 2. Convention Compliance

Run the following checks:
- [ ] File names use kebab-case (lowercase with hyphens)
- [ ] No hardcoded absolute paths (all use `{project-root}`, repo-relative paths, or `${BMAD_HOME}`)
- [ ] Draft files exist only under `${BMAD_HOME}/generated-*`
- [ ] Template wrapper draft exists when the promotion plan marks the capability public
- [ ] Promotion plan names the canonical `.agent/` and `templates/` destinations

### 3. Integration Smoke Test

- [ ] If creating a Skill draft: Verify another agent (e.g., Vegeta) can reference the draft via `${BMAD_HOME}/generated-skills/<name>/SKILL.md`; verify canonical `{project-root}/.agent/skills/<name>/SKILL.md` only after promotion approval.
- [ ] If creating a Workflow draft: Verify the generated gateway `.md` under `${BMAD_HOME}/generated-workflows/<name>/` correctly chains to all generated step files; verify canonical `.agent/workflows/` paths only after promotion approval.
- [ ] If creating an Agent draft: Verify the generated agent under `${BMAD_HOME}/generated-agents/<name>/` can be parsed and has menu structure; verify canonical `.agent/agents/` paths only after promotion approval.

### 4. Promotion Gate

Present the draft files, `metadata.yaml`, `lineage.jsonl`, and `promotion-plan.md` to the user. Wait for explicit approval before promoting.

If approved:
- Copy approved files into their canonical `.agent/` destinations.
- Sync `templates/` only when the promotion plan marks the capability public.
- Register the new capability with `.agent/scripts/add-to-kg.sh`.
- Run `.agent/scripts/validate-kg.sh`.
- Run `.agent/scripts/validate-portability.sh`.
- Update `metadata.yaml` from `status: draft` to `status: promoted`.
- Append a `candidate_promoted` event to `lineage.jsonl`.

If not approved, leave the draft under `${BMAD_HOME}` and do not change canonical repo files.

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
- [ ] User approved promotion or draft was left unpromoted
- [ ] KG and portability validation pass after promotion
- [ ] Instinct logged after promotion approval
- [ ] Sprint tracker finalized
- [ ] User has received the completion report
