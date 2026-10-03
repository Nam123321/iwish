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
import re
import yaml
from pathlib import Path

BASE_DIR = "_iwish-output/3. Development/1. Epic & Story"
GRAPH_FILE = ".agent/knowledge-graph.yaml"

def parse_frontmatter(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if content.startswith('---\n'):
                parts = content.split('---\n', 2)
                if len(parts) >= 3:
                    return yaml.safe_load(parts[1])
    except Exception:
        pass
    return {}

def main():
    graph_data = {"nodes": []}
    if os.path.exists(GRAPH_FILE):
        with open(GRAPH_FILE, "r", encoding="utf-8") as f:
            graph_data = yaml.safe_load(f) or {"nodes": []}
            if "nodes" not in graph_data:
                graph_data["nodes"] = []

    existing_ids = {str(node.get("id")).upper(): node for node in graph_data["nodes"]}
    new_nodes = []
    
    for root, dirs, files in os.walk(BASE_DIR):
        for file in files:
            if file in ["epic.md", "story.md"]:
                path = os.path.join(root, file)
                fm = parse_frontmatter(path)
                
                # Derive ID from parent dir name
                parent_dir = os.path.basename(root).upper()
                
                # Determine type
                node_type = "epic" if file == "epic.md" else "story"
                
                node_id = parent_dir
                if node_id in existing_ids:
                    # Update it
                    node = existing_ids[node_id]
                else:
                    # Create new
                    node = {
                        "id": node_id.lower(),
                        "type": node_type
                    }
                    graph_data["nodes"].append(node)
                
                # Update properties
                node["path"] = "/" + path.replace("\\", "/")
                
                # Extract title/description
                node["title"] = fm.get("title", "")
                
                desc = fm.get("description", "")
                if not desc:
                    # Look for Goal: in story.md
                    try:
                        with open(path, "r", encoding="utf-8") as f:
                            content = f.read()
                            match = re.search(r'\*\*Goal:\*\*\s*(.+?)\n', content)
                            if match: desc = match.group(1).strip()
                    except: pass
                node["description"] = desc
                
                node["tags"] = fm.get("tags", [])
                
                # Dependencies (links_to and depends_on)
                links = fm.get("links_to", [])
                dependencies = fm.get("dependencies", [])
                
                if isinstance(links, list) and links:
                    node["links_to"] = links
                if isinstance(dependencies, list) and dependencies:
                    node["depends_on"] = dependencies

    with open(GRAPH_FILE, "w", encoding="utf-8") as f:
        yaml.dump(graph_data, f, sort_keys=False, allow_unicode=True)

    print(f"Graph injected. Total nodes: {len(graph_data['nodes'])}")

if __name__ == "__main__":
    main()
