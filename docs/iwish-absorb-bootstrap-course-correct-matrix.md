# I-Wish Absorb / Bootstrap / Pivot-Project Matrix

Generated: 2026-05-16

## Purpose

This matrix tells Orch which supportive workflow should own the situation when the project is not on the happy path.

## Core Distinction

- `absorb-repo`
  Use when the missing piece is **external**: a repo, module, skill pack, or outside implementation pattern.
- `bootstrap-existing-project`
  Use when the missing piece is **foundational context** inside an existing project.
- `pivot-project`
  Use when the project already has working context, but the current execution path is no longer correct.

## Decision Matrix

| Situation | Canonical Workflow | Why |
|---|---|---|
| User wants to integrate an outside repo/module/skill pack | `absorb-repo` | External intake and compatibility planning |
| Existing codebase has little/no PRD, story, sprint, or project-context | `bootstrap-existing-project` | Context normalization before safe routing |
| Mid-sprint discovery invalidates the current plan | `pivot-project` | Re-route active execution |
| Bug fix expands into wider story/epic impact | `pivot-project` + `reconcile-change` | No longer a local patch only |
| Review uncovers large UX/spec mismatch | `pivot-project` | Need severity classification and re-slicing |
| Brownfield repo also requires external repo intake | `bootstrap-existing-project` -> `absorb-repo` | Fix base context, then intake external capability |
| Repo absorption reveals source-of-truth is too weak | `absorb-repo` -> `bootstrap-existing-project` | External understanding first, then normalize internal context |

## Severity Mapping for Pivot-Project

| Severity | Meaning | Typical Next Workflows |
|---|---|---|
| `local` | Stays within current execution slice | `code`, `review`, `reconcile-change` |
| `story` | Story scope or acceptance criteria must change | `make-story`, `make-ui-spec`, `reconcile-change` |
| `epic` | Multiple stories/features are affected | `impact-analysis`, `make-story`, `plan`, `reconcile-change` |
| `plan` | PRD/roadmap/architecture assumptions are broken | `plan`, `research`, `bootstrap-existing-project`, `reconcile-change` |

## Rule of Thumb

- Missing context = `bootstrap`
- Missing external capability = `absorb`
- Wrong direction with usable context = `pivot-project`

## Legacy Mapping

- legacy `correct-course` -> canonical `pivot-project`
- legacy `course-correct` -> canonical `pivot-project`
- legacy `document-project` / `generate-project-context` -> canonical `bootstrap-existing-project`
