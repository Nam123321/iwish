# Epics & Stories: goclone & hybrid cloner upgrade

This document maps requirements to Epics and Stories.

---

## Epic 1: Asset Crawler & Relinker

### Story 1.1: Node-based asset-harvesting script
- **Goal**: Implement asset downloading and directory sorting.
- **Acceptance Criteria**:
  - AC1: Crawl HTML, select `img`, `link[rel="stylesheet"]`, and `script[src]`.
  - AC2: Save files into local `imgs/`, `css/`, and `js/` folders.

### Story 1.2: Cheerio link rewriting
- **Goal**: Rewrite remote absolute URLs in HTML to local relative paths.
- **Acceptance Criteria**:
  - AC1: Update attributes `src` and `href` of resources.
  - AC2: Handle path collisions.

---

## Epic 2: Hybrid Cloner Logic

### Story 2.1: Integrated Hybrid Cloner ruleset
- **Goal**: Create the combined frontmatter and ruleset for the `hybrid-cloner` skill.
- **Acceptance Criteria**:
  - AC1: Define the dual-track execution workflow.
  - AC2: Save to draft rules folder.
