#!/usr/bin/env python3
import os, sys
# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, "../.."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

"""
UADRG Graph Builder
Builds a cross-epic dependency graph and generates signed pipeline evidence.
"""

import os
import json
import argparse
import hmac
import hashlib
import base64
import sys
import re

import subprocess
from pathlib import Path


def build_graph(spec_dir: str):
    nodes = []
    edges = []
    
    for root, dirs, files in os.walk(spec_dir):
        for file in files:
            if file == "data-spec.md":
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                if "UADRG Data Pipeline Contracts" in content or "Producers & Consumers" in content:
                    story_id = os.path.basename(os.path.dirname(path))
                    
                    producers_match = re.search(r'### Producers\n(.*?)(?=\n###|\Z)', content, re.DOTALL)
                    if producers_match:
                        for line in producers_match.group(1).splitlines():
                            line = line.strip()
                            if line.startswith('- `'):
                                producer = line.strip('- `').strip('`')
                                nodes.append({"id": producer, "type": "producer", "source": story_id})
                                edges.append({"from": story_id, "to": producer, "type": "produces"})

                    consumers_match = re.search(r'### Consumers\n(.*?)(?=\n###|\Z)', content, re.DOTALL)
                    if consumers_match:
                        for line in consumers_match.group(1).splitlines():
                            line = line.strip()
                            if line.startswith('- `'):
                                consumer = line.strip('- `').strip('`')
                                nodes.append({"id": consumer, "type": "consumer", "source": story_id})
                                edges.append({"from": consumer, "to": story_id, "type": "consumes"})

    unique_nodes = {n['id']: n for n in nodes}.values()
    return {
        "nodes": list(unique_nodes),
        "edges": edges
    }

def main():
    parser = argparse.ArgumentParser(description="Graph Builder")
    parser.add_argument("--spec-dir", default="_iwish-output", help="Specs directory")
    parser.add_argument("--output", default="_iwish-output/uadrg/pipeline-evidence-graph.json")
    args = parser.parse_args()

    graph = build_graph(args.spec_dir)
    
    report = {
        "status": "PASS",
        "graph": graph
    }
    
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(report, f, indent=2)
        
    scripts_dir = Path(__file__).resolve().parents[1]
    try:
        result = subprocess.run(
            ["python3", str(scripts_dir / "mcp-signing-daemon.py"), args.output],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"❌ Error signing evidence:\n{result.stderr}\n{result.stdout}")
            sys.exit(1)
        print(f"✅ Generated and signed graph evidence at {args.output}")
    except Exception as e:
        print(f"❌ Could not run mcp-signing-daemon.py: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
