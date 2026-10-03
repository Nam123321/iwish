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
import fcntl
import yaml
from pathlib import Path

def main():
    project_root = Path(__file__).resolve().parent.parent.parent
    graph_file = project_root / ".agent" / "knowledge-graph.yaml"
    
    if not graph_file.exists():
        print("Knowledge Graph file not found.")
        return

    try:
        with open(graph_file, "r+") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            
            try:
                graph_data = yaml.safe_load(f) or {"nodes": []}
            except yaml.YAMLError:
                print("Failed to parse Knowledge Graph.")
                fcntl.flock(f, fcntl.LOCK_UN)
                return
                
            if "nodes" not in graph_data or not isinstance(graph_data["nodes"], list):
                print("No nodes list found.")
                fcntl.flock(f, fcntl.LOCK_UN)
                return
                
            original_len = len(graph_data["nodes"])
            valid_nodes = []
            orphans_removed = 0
            
            for node in graph_data["nodes"]:
                if isinstance(node, dict) and node.get("type") == "skill":
                    # Check if the path exists
                    rel_path = node.get("path", "")
                    # Remove leading slash to make it relative to project root
                    if rel_path.startswith("/"):
                        rel_path = rel_path[1:]
                    
                    full_path = project_root / rel_path
                    if full_path.exists():
                        valid_nodes.append(node)
                    else:
                        print(f"Removing orphaned skill node: {node.get('id')} (Path not found: {full_path})")
                        orphans_removed += 1
                else:
                    # Keep non-skill nodes untouched
                    valid_nodes.append(node)
                    
            if orphans_removed > 0:
                graph_data["nodes"] = valid_nodes
                f.seek(0)
                f.truncate()
                yaml.dump(graph_data, f, sort_keys=False, allow_unicode=True)
                print(f"Cleanup complete. Removed {orphans_removed} orphaned skill nodes.")
            else:
                print("Cleanup complete. No orphaned skill nodes found.")
                
            fcntl.flock(f, fcntl.LOCK_UN)
            
    except Exception as e:
        print(f"Error during graph cleanup: {e}")

if __name__ == "__main__":
    main()
