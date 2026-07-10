# Step U-01: Intake

## Goal
Capture the context, determine the phase, and identify the required scanning depth.

## Instructions
1. Parse the request payload or read the current context state.
2. Determine the `phase` (e.g., discovery, planning, architecture, story, dev, review).
3. Determine the `scope` (macro or micro). If `phase` is discovery/planning/architecture, default to macro. If `phase` is story/dev/review, default to micro.
4. Determine the `depth` (quick, partial, full, auto).
5. Pass this configuration (JSON format) to `.agent/scripts/uip-filter.py` using `run_command` to get the list of required tools.

Example:
```bash
echo '{"phase":"discovery","depth":"partial","scope":"macro"}' | python3 .agent/scripts/uip-filter.py
```

## Exit Criteria
- `phase`, `scope`, and `depth` are determined.
- `uip-filter.py` has returned a list of `selected_tools`.

Next, proceed to `step-u-02-macro-scan.md` if scope is macro, or `step-u-03-micro-scan.md` if scope is micro.
