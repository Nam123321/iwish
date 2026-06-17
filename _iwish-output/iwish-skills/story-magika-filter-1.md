# Story: Create the Magika System Skill wrapper

## Description
As a System Orchestrator, I need a standard I-Wish skill that wraps the Magika Python CLI so that I can easily invoke it to scan a directory and retrieve a list of binary files to exclude.

## Acceptance Criteria
- [ ] A `SKILL.md` file is created with proper frontmatter (`name`, `description`, `inputs`, `outputs`).
- [ ] The skill includes instructions on how to install `magika` via pip if missing.
- [ ] The skill includes a helper script that runs Magika over a directory and outputs a list of files identified as non-text binaries.
- [ ] Output is structured so it can be appended directly to `.repomixignore`.

## Tasks
- [ ] Write `SKILL.md` with I-Wish system skill frontmatter.
- [ ] Write `scripts/magika-filter.sh` to run Magika, parse JSON output, and return paths.
