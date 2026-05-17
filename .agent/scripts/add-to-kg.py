#!/usr/bin/env python3
import os
import yaml
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description="Add a new node to the Knowledge Graph")
    parser.add_argument('--id', required=True, help="Node ID")
    parser.add_argument('--type', required=True, help="Node type (e.g., skill, context, fragment, workflow)")
    parser.add_argument('--path', required=True, help="Path to the file (e.g., /.agent/skills/new-skill/SKILL.md)")
    parser.add_argument('--description', required=True, help="Description of the node")
    parser.add_argument('--tags', required=True, help="Comma-separated list of tags")
    parser.add_argument('--depends-on', default="", help="Comma-separated list of dependent node IDs")
    parser.add_argument('--confidence', type=int, default=None, choices=range(1, 11), help="Confidence score 1-10 (for learning nodes)")
    parser.add_argument('--session-date', default=None, help="Session date YYYY-MM-DD (for learning nodes)")
    
    args = parser.parse_args()
    
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    kg_path = os.path.join(project_root, ".agent", "knowledge-graph.yaml")
    
    try:
        with open(kg_path, 'r') as f:
            data = yaml.safe_load(f)
    except Exception as e:
        print(f"Error reading YAML: {e}")
        sys.exit(1)
        
    if not data:
        data = {'nodes': []}
    elif 'nodes' not in data or data['nodes'] is None:
        data['nodes'] = []
        
    tags = [t.strip() for t in args.tags.split(',')] if args.tags else []
    depends_on = [d.strip() for d in getattr(args, 'depends_on', '').split(',')] if getattr(args, 'depends_on', '') else []
    
    new_node = {
        'id': args.id,
        'type': args.type,
        'path': args.path,
        'description': args.description,
        'tags': tags,
        'depends_on': depends_on
    }
    if args.confidence is not None:
        new_node['confidence'] = args.confidence
    if args.session_date is not None:
        new_node['session_date'] = args.session_date
    
    # Check if ID already exists
    for node in data['nodes']:
        if node.get('id') == args.id:
            print(f"Error: Node with ID '{args.id}' already exists.")
            sys.exit(1)
            
    data['nodes'].append(new_node)
    
    try:
        with open(kg_path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
        print(f"Successfully added node '{args.id}' to {kg_path}")
    except Exception as e:
        print(f"Error writing YAML: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
