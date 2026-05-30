# Product Requirements Document (PRD): vbsec Merge into white-hacker

## 1. Goal Description
The objective of this project is to absorb and merge the security rules, language-specific overlays, and L1-L4 data flow classification logic from the `vbsec` repository into the existing I-Wish `white-hacker` skill pack. This will enrich I-Wish's security auditing and validation capabilities while maintaining strict directory isolation and avoiding duplicate rule files.

---

## 2. Functional Requirements (FR)
- **FR1: Generic Security Rules Migration**
  - Integrate unique generic cross-language security check rules (01-21) from `vbsec` into `.agent/skills/white-hacker/rules/generic/`.
- **FR2: Language Specializations Integration**
  - Integrate specialized security rule overlays for Python, Go, PHP, TypeScript, and .NET from `vbsec` into `.agent/skills/white-hacker/rules/languages/`.
- **FR3: Data Flow Classification Guidelines**
  - Add L1-L4 taint analysis guidelines to `.agent/skills/white-hacker/references/data-flow-classification.md` to guide AI agents during exploit validation.
- **FR4: Dependency Registration**
  - Register all new rules in the I-Wish Knowledge Graph (`.agent/knowledge-graph.yaml`) and update registry linter configs.

---

## 3. Non-Functional Requirements (NFR)
- **NFR1: Duplication Prevention**
  - Do not copy duplicate rules. If a rule already exists in I-Wish's `white-hacker` with similar functionality, merge or enrich instead of copy.
- **NFR2: Directory Isolation**
  - Discard all global installation scripts (`install.sh`, `sync-skills.sh`) to prevent system escapes.
