# Step E-01: Reflection (Evidence Gathering)

## Goal
Gather data from the project's "Auto-Immune" signals to identify where capabilities (skills/workflows) are failing or need hardening.

## Mandatory Data Sources
1. **Bug Tracker**: `_iwish-output/bug-tracker.yaml` (Look for `rca`, `fiveWhys`, and `lessonLearned`).
2. **Execution Logs**: `.agent/memory/turn-exits.jsonl` (Look for workflows that exited with "failure" or "timeout").
3. **Hotspot Graph**: Query FalkorDB for files with `bug_count > 3`.

## Execution Instructions
1. **Scan Bug History**: 
   - Extract the last 5 fixed bugs from `bug-tracker.yaml`.
   - Identify the `filesChanged` and the `lessonLearned` for each.
2. **Query Hotspots**:
   - Run a command to list the top 5 files by `bug_count` from the `codegraph` database.
   - Example query: `GRAPH.QUERY codegraph "MATCH (f:File) WHERE f.bug_count > 0 RETURN f.path, f.bug_count ORDER BY f.bug_count DESC LIMIT 5"`
3. **Analyze Exit Trends**:
   - Read `turn-exits.jsonl`.
   - Identify if a specific workflow (e.g., `/fix-bug`, `/create-prd`) is frequently failing at a specific step.
4. **Summarize Evidence**:
   - Create a brief list of "Candidate Patterns for Evolution" based on the above.

## Expected Output
A summary of evidence categorized by:
- Recurring File Hotspots
- Failed Interaction Patterns
- Extracted Lessons from fixed bugs
