---
name: epic-layer-api
description: Designs and generates horizontal Layer-Epic-API (Route endpoints, contract schemas, and consumer mappings) for an Epic prior to story development.
---

# Epic Layer API (`/epic-layer-api`)

Executes horizontal backend route & API contract design for an Epic:
1. **Mandatory Template Loading**: Agent MUST read `.agent/skills/epic-layer-api/template.md` prior to drafting. All generated sections, frontmatter, and endpoint inventory tables MUST match the template's Markdown AST.
2. **Context Resolution**:
   - Reads `layer-epic-fe.md` to map user interaction requirements.
   - Reads `layer-epic-db.md` to bind endpoint parameters to authoritative models.
   - Scans `2.12. api-registry.md` and server routes to prevent endpoint collision.
3. **Execution**:
   ```bash
   python3 .agent/skills/epic-layer-api/scripts/generate-layer-api.py --epic-dir "<epic_dir>"
   ```
4. **Human Gate #3 (H4)**: HARD STOP. Present `layer-epic-api.md` to user. Requires exact keyword "Approve". Upon approval, sign via `sign_human_gate` to generate `{epic_dir}/layer-api-evidence.json.sig`.
