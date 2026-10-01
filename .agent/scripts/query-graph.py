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

import os
import sys
import json
import argparse
from pathlib import Path

# Add scripts directory to path so we can import the graph builder
sys.path.append(str(Path(__file__).parent))
try:
    from build_reconciliation_graph import build_graph
except ImportError:
    import importlib.util
    spec = importlib.util.spec_from_file_location("build_reconciliation_graph", str(Path(__file__).parent / "build-reconciliation-graph.py"))
    build_reconciliation_graph = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build_reconciliation_graph)
    build_graph = build_reconciliation_graph.build_graph

def main():
    parser = argparse.ArgumentParser(description="Query the SSOT Graph for downstream impacted files.")
    parser.add_argument("--file", type=str, required=True, help="The changed file path to query.")
    args = parser.parse_args()
    
    target_dirs = [
        "1. Idea Discovery",
        "2. Product Planning",
        "_iwish-output/stories",
        "_iwish-output"
    ]
    
    try:
        graph = build_graph(target_dirs)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
        
    cf_path = Path(args.file).resolve()
    matched_id = None
    
    for nid, node in graph.nodes.items():
        try:
            node_path = Path(node.filepath).resolve()
            if cf_path == node_path:
                matched_id = nid
                break
        except Exception:
            pass
        
        # Fallback logical ID match
        if nid in args.file:
            matched_id = nid
            break
            
    if not matched_id:
        print(json.dumps({"error": f"File '{args.file}' not found in graph.", "downstream": []}))
        sys.exit(0)
        
    impacted = list(graph.nodes[matched_id].incoming)
    
    impacted_files = []
    for inc_id in impacted:
        if inc_id in graph.nodes:
            impacted_files.append(graph.nodes[inc_id].filepath)
            
    result = {
        "node_id": matched_id,
        "downstream_ids": impacted,
        "downstream_files": impacted_files
    }
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
