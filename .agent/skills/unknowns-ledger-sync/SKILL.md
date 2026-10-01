---
name: unknowns-ledger-sync
description: Automatically aggregates and syncs findings from per-story unknowns-gate JSON files into the central unknowns-ledger.yaml.
inputs: [story_unknowns_files]
outputs: [unknowns-ledger.yaml]
mcp_tools_required: []
subagent_triggers: []
---

# Unknowns Ledger Sync

## Purpose
Automatically aggregates and syncs findings from per-story `unknowns-gate` JSON files into the central `unknowns-ledger.yaml` knowledge base to maintain a unified source of truth for project unknowns and risks.

## Execution Rules
1. **Discovery**: Locate all per-story unknowns-gate JSON files across the repository (`_iwish-output/unknowns/` or story-specific output directories).
2. **Aggregation**: Parse the JSON files and aggregate the identified unknowns, deviations, and risks.
3. **Deduplication**: Match new unknowns against existing entries in `_iwish-output/unknowns/unknowns-ledger.yaml` using Risk ID and context.
4. **Synchronization**: Append new or modified entries to the central `unknowns-ledger.yaml`. 
5. **Validation**: Ensure synchronized entries follow the strictly typed schema required by the Unknowns Protocol (Risk ID, Description, Severity, Citations).
6. **Dry-Run Mode (`--dry-run` or `--validate-only`)**: When invoked with these flags, the skill MUST NOT modify any ledger files. It should only validate if the required updates are present in the provided commits or diffs (stateless validation for CI/CD sandbox).
7. **Git Trailer & AST Extraction**: For accurate mapping to Unknown IDs during validation, the skill MUST support extracting Git trailers (e.g., `Resolves-Unknown: MACRO-SEC-001`) from commit messages, and cross-referencing them with AST-aware annotations or diff intersections to prevent false positives.
