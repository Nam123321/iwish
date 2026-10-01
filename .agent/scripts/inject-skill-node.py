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
import yaml
import fcntl
import argparse
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Inject a single skill node into the Knowledge Graph safely.")
    parser.add_argument('--metadata-file', required=True, help="Path to JSON file containing node metadata to prevent command injection.")
    args = parser.parse_args()

    metadata_path = Path(args.metadata_file)
    if not metadata_path.exists():
        print(f"Error: Metadata file {metadata_path} not found.")
        sys.exit(1)

    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except Exception as e:
        print(f"Error reading metadata JSON: {e}")
        sys.exit(1)
        
    skill_id = metadata.get("id")
    if not skill_id:
        print("Error: Missing 'id' in metadata.")
        sys.exit(1)
        
    project_root = Path(__file__).resolve().parent.parent.parent
    graph_file = project_root / ".agent" / "knowledge-graph.yaml"
    lock_file = project_root / ".agent" / "knowledge-graph.lock"
    
    node = {
        "id": skill_id,
        "type": "skill",
        "path": metadata.get("path", f"/.agent/skills/{skill_id}/SKILL.md"),
        "title": metadata.get("title", skill_id),
        "description": metadata.get("description", ""),
        "graph_visibility": metadata.get("graph_visibility", "public"),
        "tags": metadata.get("tags", []),
        "depends_on": metadata.get("depends_on", [])
    }
    
    # Phase 2: Safely update the graph
    try:
        with open(lock_file, "w") as lf:
            fcntl.flock(lf, fcntl.LOCK_EX)
            
            graph_data = {"nodes": []}
            if graph_file.exists():
                with open(graph_file, "r", encoding="utf-8") as f:
                    try:
                        graph_data = yaml.safe_load(f) or {"nodes": []}
                    except yaml.YAMLError:
                        pass
                        
            if "nodes" not in graph_data or not isinstance(graph_data["nodes"], list):
                graph_data["nodes"] = []
                
            existing_nodes = {str(n.get("id")).lower(): n for n in graph_data["nodes"] if isinstance(n, dict)}
            
            # Upsert
            existing_nodes[skill_id.lower()] = node
                
            graph_data["nodes"] = list(existing_nodes.values())
            
            # Atomic Write
            tmp_file = graph_file.with_suffix(".tmp")
            with open(tmp_file, "w", encoding="utf-8") as tf:
                yaml.dump(graph_data, tf, sort_keys=False, allow_unicode=True)
                tf.flush()
                os.fsync(tf.fileno())
                
            os.replace(tmp_file, graph_file)
            
        print(f"Successfully injected node '{skill_id}' into the Knowledge Graph.")
    except Exception as e:
        print(f"Failed to update Knowledge Graph: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
