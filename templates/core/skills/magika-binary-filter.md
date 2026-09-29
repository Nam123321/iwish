---
name: magika-binary-filter
description: "A supportive System Skill that uses Deep Learning (Magika) to filter out binary files before processing repos."
inputs: ["target_directory"]
outputs: ["list_of_binary_files"]
mcp_tools_required: ["run_command"]
subagent_triggers: []
---

# SKILL: Magika Binary Filter

## Purpose
This skill utilizes Google's Magika (an ML-based file content detector) to rapidly identify and filter out binary, executable, and image files. It is specifically designed to be used as a pre-ingest hook for `/absorb-repo` and `repomix` to avoid inflating context limits with unreadable data.

## Execution Rules
1. Ensure the `magika` Python package is installed (`pip install magika`).
2. Run the provided helper script on the target directory.
3. Append the resulting output file to `.repomixignore` or `.gitignore` so that downstream processing skips these binaries.

## Usage Guide
Run the script using the `run_command` tool:
```bash
bash .agent/skills/magika-binary-filter/scripts/magika-filter.sh <target_directory> <output_file>
```

**Example:**
```bash
bash .agent/skills/magika-binary-filter/scripts/magika-filter.sh ~/.iwish/sandbox/target-repo ~/.iwish/sandbox/target-repo/.repomixignore
```

## Internal Scripts
- `scripts/magika-filter.sh`: Automates the CLI invocation, parses the JSONL response using `jq`, and filters out files where `output.group` is not `text` or `code`.
