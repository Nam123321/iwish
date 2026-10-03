#!/usr/bin/env python3
import os, sys
# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


REQUIRED_TOOLS = {
    "spec": ["unknowns-scanner", "bias-detector", "schema-analyzer"],
    "dev": ["drift-detector", "deviation-logger", "fmea-scanner"],
    "review": ["debiasing-check", "drift-detector", "merge-quiz"],
}


def run(cmd, cwd):
    completed = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=False)
    output = (completed.stdout or "").strip()
    if completed.stderr:
        output = f"{output}\n{completed.stderr.strip()}".strip()
    parsed = None
    if output:
        for line in reversed(output.splitlines()):
            line = line.strip()
            if not line:
                continue
            if line.startswith("{") and line.endswith("}"):
                try:
                    parsed = json.loads(line)
                    break
                except json.JSONDecodeError:
                    pass
        if parsed is None and output.startswith("{"):
            try:
                parsed = json.loads(output)
            except json.JSONDecodeError:
                parsed = None
    return {
        "cmd": cmd,
        "exit_code": completed.returncode,
        "output": output,
        "json": parsed,
    }


def summarize_findings(tool_id, result):
    payload = result.get("json") or {}
    findings = payload.get("findings", [])
    if not isinstance(findings, list):
        findings = []
    return [
        {
            "tool": tool_id,
            "severity": str(item.get("severity", "info")),
            "message": item.get("message")
            or item.get("description")
            or item.get("failure_mode")
            or str(item)[:240],
        }
        for item in findings
        if isinstance(item, dict)
    ]


def main():
    parser = argparse.ArgumentParser(description="Run embedded unknowns scanner and write gate receipt.")
    parser.add_argument("--story-id", required=True)
    parser.add_argument("--phase", required=True, choices=["spec", "dev", "review"])
    parser.add_argument("--context", required=True)
    parser.add_argument("--story-dir", required=True)
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    project_root = Path.cwd()
    story_dir = Path(args.story_dir)
    context_path = Path(args.context)
    
    if not context_path.is_file():
        # Heuristic fallback for incorrect --context arguments (e.g. 'dev', 'review', '{story_file}')
        if args.phase == "spec":
            if (story_dir / "ui-spec.md").is_file():
                context_path = story_dir / "ui-spec.md"
            elif (story_dir / f"ui-spec-story-{args.story_id}.md").is_file():
                context_path = story_dir / f"ui-spec-story-{args.story_id}.md"
            elif (story_dir / "data-spec.md").is_file():
                context_path = story_dir / "data-spec.md"
            elif (story_dir / f"data-spec-story-{args.story_id}.md").is_file():
                context_path = story_dir / f"data-spec-story-{args.story_id}.md"
            elif (story_dir / "story.md").is_file():
                context_path = story_dir / "story.md"
            else:
                context_path = story_dir / f"story-{args.story_id}.md"
        else:
            if (story_dir / "story.md").is_file():
                context_path = story_dir / "story.md"
            elif (story_dir / f"story-{args.story_id}.md").is_file():
                context_path = story_dir / f"story-{args.story_id}.md"
            else:
                context_path = story_dir / f"story-{args.story_id}.md"  # default to flat if neither exists

            
    context = str(context_path.resolve())
    output = Path(args.output) if args.output else story_dir / f"unknowns-gate-{args.story_id}-{args.phase}.json"

    filter_payload = json.dumps({
        "phase": args.phase,
        "depth": "quick",
        "scope": "all",
        "context_file": context,
    })
    filter_result = run([sys.executable, ".agent/scripts/uip-filter.py", filter_payload], project_root)

    tools = REQUIRED_TOOLS[args.phase]
    results = {"uip-filter": filter_result}
    findings = []

    if args.phase == "spec":
        fmea = run([sys.executable, ".agent/scripts/uip-fmea-scanner.py", "--context", context, "--deep"], project_root)
        deviation = run([sys.executable, ".agent/scripts/uip-deviation-logger.py", "--context", context], project_root)
        results["unknowns-scanner"] = fmea
        results["bias-detector"] = run([sys.executable, ".agent/scripts/uip-bias-detector.py", "--context", context], project_root)
        results["schema-analyzer"] = run([sys.executable, ".agent/scripts/uip-schema-analyzer.py", "--context", context], project_root)
        results["deviation-logger"] = deviation
    elif args.phase == "dev":
        results["drift-detector"] = run([sys.executable, ".agent/scripts/uip-drift-detector.py", context], project_root)
        results["deviation-logger"] = run([sys.executable, ".agent/scripts/uip-deviation-logger.py", "--context", context], project_root)
        results["fmea-scanner"] = run([sys.executable, ".agent/scripts/uip-fmea-scanner.py", "--context", context, "--deep"], project_root)
    elif args.phase == "review":
        results["debiasing-check"] = run([sys.executable, ".agent/scripts/uip-debiasing-check.py", "--context", context], project_root)
        results["drift-detector"] = run([sys.executable, ".agent/scripts/uip-drift-detector.py", context], project_root)
        results["merge-quiz"] = run([sys.executable, ".agent/scripts/uip-merge-quiz.py", "--context", context], project_root)

    for tool_id, result in results.items():
        findings.extend(summarize_findings(tool_id, result))

    failed_tools = [tool_id for tool_id, result in results.items() if result["exit_code"] != 0 and tool_id in tools]
    receipt = {
        "story_id": args.story_id,
        "phase": args.phase,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tool_id": "unknowns-scanner",
        "execution_id": f"story-{args.story_id}-{args.phase}-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
        "status": "FAILED" if failed_tools else "VERIFIED",
        "coverage": max(1, len(results)),
        "findings": findings,
        "tools_executed": tools,
        "bridge_executed": args.phase == "review",
        "macro_impact": False,
        "tool_results": {
            tool_id: {
                "exit_code": result["exit_code"],
                "output_excerpt": result["output"][:1200],
            }
            for tool_id, result in results.items()
        },
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(output), "status": receipt["status"], "tools_executed": tools}, indent=2))
    sys.exit(1 if failed_tools else 0)


if __name__ == "__main__":
    main()
