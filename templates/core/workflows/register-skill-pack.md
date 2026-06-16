---
name: register-skill-pack
description: Open customization module intake flow for external skills, skill
  packs, and hybrid repositories
---

# /register-skill-pack

## Purpose

Canonical Open 2 intake workflow for bringing third-party skills, skill packs, workflow packs, or hybrid repos into I-Wish without forcing them through a closed marketplace.

## Workflow

1. **Intake**
   - Accept Git URL, local path, packaged archive, or user-provided skill directory.
   - Ask for intended scope: `official-internal`, `community`, `project-local`, or `experimental`.

2. **Trust & Safety Gate**
   - If source is a repo, run `/absorb-repo` Phase 0 trust/security checks first.
   - If source is a direct skill pack, inspect for executable/tool assumptions, external network assumptions, and missing provenance.

3. **Classify External Payload**
   - Determine whether the source is:
     - native skill pack
     - workflow pack
     - agent pack
     - tool adapter pack
     - hybrid repo that needs absorption

4. **Normalize to I-Wish Package Contract**
   - For callable skills, ensure `SKILL.md`.
   - For orchestration-heavy assets, add `DESIGN.md`.
   - Add `metadata.yaml`, `lineage.jsonl`, `promotion-plan.md`, and optional `customize.toml`.

5. **Register as Open Customization Module**
   - Call `iwish register-module` with:
     - module class
     - registration mode
     - routing triggers
     - tool dependencies
   - Index the result into the runtime catalog and skillgraph-facing inventory.

6. **Integration Planning & Review Pack**
   - Create an adoption review pack using `docs/iwish-adoption-review-pack-standard.md`.
   - Runtime default: `iwish register-module` should auto-generate this pack so the intake flow always leaves a readable artifact behind.
   - Produce BOTH:
     - `docs/open-modules/<name>-integration-guide.md`
     - `docs/open-modules/<name>-integration-guide.html`
   - The review pack MUST include:
     - delivery framework placement
     - core use cases
     - adjacent use cases
     - edge cases
     - stress cases
     - constraints and anti-triggers
     - agent / workflow / skill coordination
     - review questions for the user
   - This artifact is for BOTH user review and future Orch routing context.

7. **Routing & Tool Validation**
   - Validate that Orch can discover the imported unit via `iwish route`.
   - If required tools are missing, select or recommend the relevant tool profile.

8. **Human Promotion Check**
   - Keep the imported pack as external/custom until explicitly promoted into canonical internal assets.

## Output

- External module record in `_iwish/catalog/external-modules/`
- Optional absorbed research artifacts
- Routing trigger hints and tool dependency metadata
- Adoption review pack in `.md` + `.html`
- Reviewer-visible promotion recommendation
