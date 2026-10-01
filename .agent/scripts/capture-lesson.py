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

import sys, json, os, datetime

def main():
    story_id = None
    tags = []
    phase = []
    severity = "guideline"
    domain = "general"
    root_cause = "unknown"
    context = None
    rule = None
    test_mode = "--test" in sys.argv

    # args parsing
    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == "--story-id" and i+1 < len(sys.argv):
            story_id = sys.argv[i+1]
            i += 2
        elif arg == "--tags" and i+1 < len(sys.argv):
            tags = sys.argv[i+1].split(",")
            i += 2
        elif arg == "--phase" and i+1 < len(sys.argv):
            phase = sys.argv[i+1].split(",")
            i += 2
        elif arg == "--severity" and i+1 < len(sys.argv):
            severity = sys.argv[i+1]
            i += 2
        elif arg == "--domain" and i+1 < len(sys.argv):
            domain = sys.argv[i+1]
            i += 2
        elif arg == "--root-cause" and i+1 < len(sys.argv):
            root_cause = sys.argv[i+1]
            i += 2
        elif arg == "--context" and i+1 < len(sys.argv):
            context = sys.argv[i+1]
            i += 2
        elif arg == "--rule" and i+1 < len(sys.argv):
            rule = sys.argv[i+1]
            i += 2
        elif arg == "--test":
            i += 1
        else:
            i += 1

    if "--help" in sys.argv or "-h" in sys.argv:
        print("Usage: capture-lesson.py --story-id <id> --tags <tags> --phase <phase> --severity <sev> --domain <domain> --root-cause <cause> --context <context> --rule <rule> [--test]")
        sys.exit(0)
        
    if test_mode:
        story_id = story_id or "test-1"
        context = context or "Test context"
        rule = rule or "Test rule"
        tags = tags or ["test", "async"]
        phase = phase or ["implementation"]

    if not story_id or not context or not rule:
        print("Error: --story-id, --context, and --rule are required.")
        sys.exit(1)

    ledger_path = "_iwish-output/lessons/lessons-ledger.jsonl"
    os.makedirs(os.path.dirname(ledger_path), exist_ok=True)

    entry = {
        "id": f"LSN-{int(datetime.datetime.now(datetime.timezone.utc).timestamp())}",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z'),
        "story_id": story_id,
        "target_phase": phase,
        "severity": severity,
        "domain": domain,
        "tags": tags,
        "root_cause_type": root_cause,
        "context": context,
        "enforcement_rule": rule
    }

    with open(ledger_path, "a") as f:
        f.write(json.dumps(entry) + "\n")

    print(f"✅ Lesson captured successfully for story {story_id}.")
    sys.exit(0)

if __name__ == "__main__":
    main()
