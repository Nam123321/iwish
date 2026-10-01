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

"""
Evaluate Source Enrichment
Evaluates if a NotebookLM notebook requires source enrichment before querying.
This script compares required topics/domains against the metadata of existing sources.
Usage: python3 evaluate-source-enrichment.py --notebook-id <ID> --required-topics "auth,billing" --output <path>
"""

import argparse
import json
import sys
import os
import yaml
from datetime import datetime, timezone

def get_notebook_sources(notebook_id):
    registry_path = "_iwish-output/notebooks/notebook-registry.yaml"
    if not os.path.exists(registry_path):
        return []
    try:
        with open(registry_path, "r") as f:
            reg = yaml.safe_load(f)
        for nb in reg.get("notebooks", []):
            if nb.get("id") == notebook_id:
                return nb.get("sync_sources", [])
    except Exception:
        pass
    return []

def calculate_age(sources):
    if not sources:
        return 9999
    now = datetime.now(timezone.utc)
    total_days = 0
    valid_sources = 0
    for s in sources:
        ls = s.get("last_synced")
        if ls:
            try:
                ls_time = datetime.fromisoformat(ls.replace("Z", "+00:00"))
                delta = now - ls_time
                total_days += delta.days
                valid_sources += 1
            except Exception:
                pass
    if valid_sources == 0:
        return 9999
    return total_days / valid_sources

def evaluate_gaps(required_topics, sources):
    existing_paths = [s.get("path", "").lower() for s in sources]
    gaps = []
    for req in required_topics:
        req_lower = req.lower().strip()
        if not any(req_lower in path for path in existing_paths):
            gaps.append(req)
    return gaps

def main():
    if os.environ.get("UKP_ACTIVE") == "false":
        print("⏭️ UKP is disabled via UKP_ACTIVE=false. Skipping evaluation.")
        sys.exit(0)

    parser = argparse.ArgumentParser(description="Evaluate if notebook requires source enrichment")
    parser.add_argument("--notebook-id", required=True, help="ID of the NotebookLM notebook")
    parser.add_argument("--required-topics", required=True, help="Comma-separated list of required topics/domains")
    parser.add_argument("--output", required=True, help="Path to write the JSON evaluation result")
    args = parser.parse_args()

    required_topics = [t.strip() for t in args.required_topics.split(",") if t.strip()]
    
    sources = get_notebook_sources(args.notebook_id)
    gaps = evaluate_gaps(required_topics, sources)
    avg_age = calculate_age(sources)
    
    needs_enrichment = len(gaps) > 0 or avg_age > 7
    
    if len(gaps) > len(required_topics)/2 or avg_age > 30:
        mode = "deep"
    elif needs_enrichment:
        mode = "fast"
    else:
        mode = "skip"
        
    result = {
        "notebook_id": args.notebook_id,
        "needs_enrichment": needs_enrichment,
        "identified_gaps": gaps,
        "existing_source_count": len(sources),
        "average_source_age_days": avg_age,
        "mode": mode
    }
    
    try:
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2)
        print(f"Evaluation complete. Mode: {mode}. Output saved to {args.output}")
    except Exception as e:
        print(f"Error saving output: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
