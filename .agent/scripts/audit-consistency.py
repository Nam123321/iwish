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
import json

BASE_DIR = "_iwish-output/3. Development/1. Epic & Story"
PLANNING_FILE = "_iwish-output/2. Product Planning/2.4. epics-and-stories.md"
GRAPH_FILE = ".agent/knowledge-graph.yaml"

def get_physical_ids():
    epics = set()
    stories = set()
    if os.path.exists(BASE_DIR):
        for root, dirs, files in os.walk(BASE_DIR):
            for file in files:
                if file == "epic.md":
                    epics.add(os.path.basename(root).upper())
                elif file == "story.md":
                    stories.add(os.path.basename(root).upper())
    return epics, stories

def get_planning_ids():
    epics = set()
    stories = set()
    if os.path.exists(PLANNING_FILE):
        with open(PLANNING_FILE, "r", encoding="utf-8") as f:
            for line in f:
                # Epic in table: | **EPIC-42** |
                epic_match = re.search(r'\|\s*\*\*(EPIC-[\w.-]+)\*\*\s*\|', line, re.IGNORECASE)
                if epic_match: epics.add(epic_match.group(1).upper())
                
                # Story in list: - [STORY-42.1: ...
                story_match = re.search(r'-\s*\[(STORY-[\w.-]+):', line, re.IGNORECASE)
                if story_match: stories.add(story_match.group(1).upper())
    return epics, stories

def get_graph_ids():
    epics = set()
    stories = set()
    if os.path.exists(GRAPH_FILE):
        with open(GRAPH_FILE, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            if data and "nodes" in data:
                nodes = data["nodes"]
                if isinstance(nodes, list):
                    for node in nodes:
                        nid = str(node.get("id")).upper()
                        if nid.startswith("EPIC-"): epics.add(nid)
                        elif nid.startswith("STORY-"): stories.add(nid)
                elif isinstance(nodes, dict):
                    for nid in nodes.keys():
                        nid = str(nid).upper()
                        if nid.startswith("EPIC-"): epics.add(nid)
                        elif nid.startswith("STORY-"): stories.add(nid)
    return epics, stories

if __name__ == "__main__":
    p_epics, p_stories = get_physical_ids()
    pl_epics, pl_stories = get_planning_ids()
    g_epics, g_stories = get_graph_ids()
    
    result = {
        "stories_in_planning_but_no_physical": sorted(list(pl_stories - p_stories)),
        "stories_in_physical_but_no_planning": sorted(list(p_stories - pl_stories)),
        "stories_in_graph_but_no_physical": sorted(list(g_stories - p_stories)),
        "stories_in_physical_but_no_graph": sorted(list(p_stories - g_stories)),
        "epics_in_planning_but_no_physical": sorted(list(pl_epics - p_epics)),
        "epics_in_physical_but_no_planning": sorted(list(p_epics - pl_epics))
    }
    print(json.dumps(result, indent=2))
