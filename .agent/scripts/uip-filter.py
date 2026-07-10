import sys
import json
import yaml
import os

REGISTRY_PATH = os.path.join(os.path.dirname(__file__), "..", "unknowns", "tool-registry.yaml")

def resolve_tools(phase, depth="auto", scope="micro"):
    if not os.path.exists(REGISTRY_PATH):
        print(json.dumps({"error": f"Registry not found at {REGISTRY_PATH}"}))
        sys.exit(1)
        
    with open(REGISTRY_PATH, 'r') as f:
        registry = yaml.safe_load(f)
        
    tools = registry.get("tools", [])
    
    # Filter by phase
    filtered = [t for t in tools if phase in t.get("phases", [])]
    
    # Filter by depth
    if depth == "quick":
        filtered = [t for t in filtered if t.get("cost") == "low"]
    elif depth == "partial":
        filtered = [t for t in filtered if t.get("cost") in ["low", "medium"]]
        
    result = {
        "selected_tools": [t["id"] for t in filtered],
        "tool_details": filtered
    }
    
    print(json.dumps(result, indent=2))
    sys.exit(0)

if __name__ == "__main__":
    input_data = sys.stdin.read().strip()
    if not input_data:
        print(json.dumps({"error": "Empty stdin. Provide JSON config like {\"phase\":\"story\",\"depth\":\"auto\"}"}))
        sys.exit(1)
        
    try:
        config = json.loads(input_data)
        resolve_tools(
            phase=config.get("phase", "story"),
            depth=config.get("depth", "auto"),
            scope=config.get("scope", "micro")
        )
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON on stdin"}))
        sys.exit(1)
