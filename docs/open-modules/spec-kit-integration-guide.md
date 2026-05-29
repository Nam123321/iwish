# Open Module Integration Guide: spec-kit

This integration guide defines the strategy for adopting, adapting, or referencing components of the `spec-kit` repository into the I-Wish ecosystem.

---

## 1. Classification & System Placement
- **Shape & Role:** Utility and integration adapter (`SYSTEM_SKILL` path).
- **Placement:** Under `.agent/skills/` (specifically under a new skill path `.agent/skills/editor-compatibility/`).
- **Core Role:** Translates and registers I-Wish behavioral tokens, checklists, and guides into agent directories of third-party IDE editors (e.g. Claude Code, Copilot, Goose, Roo).

---

## 2. Core Use Cases
1. **Multi-IDE Workspace Compatibility:** A developer working with Claude Code inside VS Code or Roo in Cursor can export I-Wish checklists and prompt assets to their local editors dynamically.
2. **Path Integrity Shield:** Using the path traversal guard helper (`_ensure_inside`) to protect all I-Wish workspace write tools.

---

## 3. Adjacent & Edge Cases
- **Symlinking Failures (Windows):** In dev mode, if symlinks fail due to OS restrictions, the engine must fall back to direct file copies.
- **Dynamic Path Overwrite:** If the user upgrades their IDE settings, the system should prompt before overwriting local `.prompt.md` files.

---

## 4. Operational Constraints
- **Scope Limit:** Do **not** adopt the shell runner engine or templates from `spec-kit`. I-Wish has a more mature workflow and verification engine.
- **Python Dependency:** The ported utilities must be written in Python to integrate natively with I-Wish backend services or scripts.

---

## 5. Agent & Workflow Coordination
- **`orch-agent` Routing Hints:** If the user mentions working in Cursor, Windsurf, or Copilot, `orch-agent` should route to `/sync-skills` or `/register-editor-skills` to publish compatibility assets.
- **`dev-agent` Rules:** Must run all workspace file writes through the newly adopted `_ensure_inside` validation.

---

## 6. Review Questions for the User
1. **Target Editor Support:** Do you actively use editors like Roo, Copilot, or Goose alongside I-Wish, and do you want I-Wish skills exported to them?
2. **Integration Path:** Should we proceed with creating the `editor-compatibility` skill to port the path traversal shield and format conversion helpers?
