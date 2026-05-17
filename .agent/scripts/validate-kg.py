#!/usr/bin/env python3
import os
import yaml
import sys

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    kg_path = os.path.join(project_root, ".agent", "knowledge-graph.yaml")
    
    if not os.path.exists(kg_path):
        print(f"Error: {kg_path} not found.")
        sys.exit(1)
        
    try:
        with open(kg_path, 'r') as f:
            data = yaml.safe_load(f)
    except Exception as e:
        print(f"Error parsing YAML: {e}")
        sys.exit(1)
        
    if not data or 'nodes' not in data:
        print("Invalid YAML structure: 'nodes' key missing.")
        sys.exit(1)
        
    errors = 0
    for node in data.get('nodes', []):
        node_id = node.get('id', 'UNKNOWN')
        rel_path = node.get('path', '')
        if not rel_path:
            print(f"Error: Node '{node_id}' is missing 'path'.")
            errors += 1
            continue
            
        # Remove leading slash if present to make path joining correct
        if rel_path.startswith('/'):
            rel_path = rel_path[1:]
            
        full_path = os.path.join(project_root, rel_path)
        if not os.path.exists(full_path):
            print(f"Error: Path '{rel_path}' for node '{node_id}' does not exist.")
            errors += 1
            
    if errors > 0:
        print(f"Validation failed with {errors} errors.")
        sys.exit(1)
    else:
        print("Knowledge Graph validation passed. All paths exist.")
        sys.exit(0)

if __name__ == '__main__':
    main()
