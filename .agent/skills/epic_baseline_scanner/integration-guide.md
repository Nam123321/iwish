# Integration Guide: Epic Baseline Scanner

## Overview
This skill provides a zero-trust `runner.py` script to deterministically extract unknowns from an Epic file and output them as a JSON schema.

## Integration Points
1. **Epic Creation Workflow**: When a new Epic is generated, immediately call this skill via its runner.
2. **Unknowns Analyst**: Use this skill when auditing Epics for missing risk baselines.

## Command
```bash
python3 .agent/skills/epic_baseline_scanner/scripts/runner.py --epic <epic_id>
```
