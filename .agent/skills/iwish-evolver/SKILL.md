---
name: "iwish-evolver"
description: "I-Wish self-evolving skill engine. Automates skill mutations inside Git branches, filters warm-up latency, and enforces strict execution timeouts."
---

# I-Wish Evolver Skill

The **I-Wish Evolver** skill integrates the I-Wish self-evolving skill engine into the I-Wish system, using Git sandboxes and time budget enforcements to ensure safe, continuous learning and automatic bug repair.

## Core Capabilities

### 1. Warm-up Latency Filtering
Validation timings exclude the first execution ("cold run") to avoid penalizing performance metrics due to cold starts, such as:
- Initial Docker container spin-up times.
- Host filesystem caches warming.
- Initial model or library load times (e.g., JIT compile, embedding load).

### 2. Time-Budget Enforcement
Limits runaway loops or hangs by wrapping subprocess runs in process groups and cleanly terminating the entire group via `SIGKILL` if the timeout budget is exceeded.

## Script Usage

Run `time-budget-filter.py` to wrap commands:

```bash
python3 .agent/skills/iwish-evolver/scripts/time-budget-filter.py [options] -- <command> [args...]
```

### Options
- `-i`, `--iterations`: Number of total iterations to run (default: `3`).
- `-b`, `--budget`: Strict timeout in seconds for each iteration (default: `30.0`).
- `-s`, `--shell`: Execute the command using the shell (as a string).

### Output
Outputs a JSON report to standard output:
```json
{
  "status": "SUCCESS" | "TIMEOUT" | "ERROR",
  "iterations": [
    {
      "iteration": 1,
      "duration_seconds": 1.234,
      "exit_code": 0,
      "status": "success"
    }
  ],
  "cold_run_seconds": 1.234,
  "warm_runs_seconds": [0.456, 0.448],
  "average_warm_duration_seconds": 0.452,
  "error": null | "Error description"
}
```
