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
import yaml
import fcntl
from pathlib import Path

# Fix: Use standard library yaml parsing, handle errors gracefully
def parse_frontmatter(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if content.startswith('---\n'):
                parts = content.split('---\n', 2)
                if len(parts) >= 3:
                    try:
                        return yaml.safe_load(parts[1]) or {}
                    except yaml.YAMLError:
                        print(f"Warning: Malformed YAML frontmatter in {filepath}")
                        return None
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
    return {}

def main():
    project_root = Path(__file__).resolve().parent.parent.parent
    skills_dir = project_root / ".agent" / "skills"
    graph_file = project_root / ".agent" / "knowledge-graph.yaml"
    lock_file = project_root / ".agent" / "knowledge-graph.lock"
    
    if not skills_dir.exists():
        print("Skills directory not found.")
        return

    # Phase 1: Collect all skills
    new_nodes = {}
    for skill_folder in skills_dir.iterdir():
        if not skill_folder.is_dir():
            continue
            
        skill_file = skill_folder / "SKILL.md"
        if not skill_file.exists():
            continue
            
        skill_id = skill_folder.name.lower()
        fm = parse_frontmatter(skill_file)
        if fm is None:
            print(f"Skipping {skill_id} due to malformed frontmatter.")
            continue
        
        # Build node
        rel_path = f"/.agent/skills/{skill_folder.name}/SKILL.md"
        node = {
            "id": skill_id,
            "type": "skill",
            "path": rel_path,
            "title": fm.get("name", skill_id),
            "description": fm.get("description", ""),
            "graph_visibility": fm.get("graph_visibility", "public"),
            "tags": fm.get("tags", []),
            "depends_on": fm.get("dependencies", [])
        }
        new_nodes[skill_id] = node

    workflows_dir = project_root / ".agent" / "workflows"
    if workflows_dir.exists():
        for workflow_file in workflows_dir.glob("*.md"):
            workflow_id = workflow_file.stem.lower()
            fm = parse_frontmatter(workflow_file)
            if fm is None:
                print(f"Skipping {workflow_id} due to malformed frontmatter.")
                continue
            
            # Build node
            rel_path = f"/.agent/workflows/{workflow_file.name}"
            node = {
                "id": workflow_id,
                "type": "workflow",
                "path": rel_path,
                "title": fm.get("name", workflow_id),
                "description": fm.get("description", ""),
                "graph_visibility": fm.get("graph_visibility", "public"),
                "tags": fm.get("tags", []),
                "depends_on": fm.get("dependencies", [])
            }
            new_nodes[workflow_id] = node

    if not new_nodes:
        print("No skills or workflows found to ingest.")
        return

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
            
            # Upsert new nodes
            for node_id, node in new_nodes.items():
                existing_nodes[node_id] = node
                
            # Filter out deleted skills/workflows
            final_nodes = []
            for nid, n in existing_nodes.items():
                t = n.get("type")
                if t in ("skill", "workflow") and nid not in new_nodes:
                    continue
                final_nodes.append(n)
                
            graph_data["nodes"] = final_nodes
            
            # Atomic Write
            tmp_file = graph_file.with_suffix(".tmp")
            with open(tmp_file, "w", encoding="utf-8") as tf:
                yaml.dump(graph_data, tf, sort_keys=False, allow_unicode=True)
                tf.flush()
                os.fsync(tf.fileno())
                
            os.replace(tmp_file, graph_file)
            
        print(f"Successfully ingested {len(new_nodes)} skills/workflows into the Knowledge Graph.")
    except Exception as e:
        print(f"Failed to update Knowledge Graph: {e}")

if __name__ == "__main__":
    main()
